#!/usr/bin/env node

// Validates every plugin package rendered from plugin.config.json, for every
// env, without touching disk:
//   - vendor rules for the OpenAI (Codex/ChatGPT) and Claude Code packages
//   - the consistency invariant: a staging or local build is the production
//     build with only the server URLs and the test labels changed
//
// Run `npm run build:plugin -- --check` alongside this to catch hand edits
// to the committed manifests.

import { isDeepStrictEqual } from 'util';
import { existsSync, statSync } from 'fs';
import {
  ENVS,
  LOCAL_CONFIG_PATH,
  TARGETS,
  loadConfig,
  render
} from './plugin-config.js';

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HEX_COLOR_RE = /^#[0-9A-F]{6}$/i;
const PLUGIN_NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

// OpenAI: "only one MCP server can be connected per plugin" on submission.
// https://developers.openai.com/plugins/deploy/submission
const OPENAI_MAX_SERVERS = 1;
// Claude plugin pre-submission checklist.
// https://claude.com/docs/plugins/pre-submission-checklist
const CLAUDE_MAX_FILES = 512;
const CLAUDE_MAX_FILE_BYTES = 256 * 1024;

function requireString(errors, object, field, prefix) {
  const value = object?.[field];
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${prefix}.${field} must be a non-empty string`);
    return undefined;
  }
  return value;
}

function requireHttpsUrl(errors, object, field, prefix) {
  const value = requireString(errors, object, field, prefix);
  if (!value) return;
  try {
    if (new URL(value).protocol !== 'https:') {
      errors.push(`${prefix}.${field} must use https`);
    }
  } catch {
    errors.push(`${prefix}.${field} must be an absolute URL`);
  }
}

function validateCommonManifest(errors, manifest, prefix) {
  const name = requireString(errors, manifest, 'name', prefix);
  if (name && (!PLUGIN_NAME_RE.test(name) || name.length > 64)) {
    errors.push(`${prefix}.name must be kebab-case, at most 64 characters`);
  }
  const version = requireString(errors, manifest, 'version', prefix);
  if (version && !SEMVER_RE.test(version)) {
    errors.push(`${prefix}.version must be strict semver`);
  }
  requireString(errors, manifest, 'description', prefix);
  if (!manifest.author || typeof manifest.author !== 'object') {
    errors.push(`${prefix}.author must be an object`);
  } else {
    requireString(errors, manifest.author, 'name', `${prefix}.author`);
    requireHttpsUrl(errors, manifest.author, 'url', `${prefix}.author`);
  }
  if (manifest.skills !== './skills/') {
    errors.push(`${prefix}.skills must be "./skills/"`);
  }
  if (manifest.mcpServers !== './.mcp.json') {
    errors.push(`${prefix}.mcpServers must be "./.mcp.json"`);
  }
}

function validateCodexInterface(errors, manifest, prefix) {
  const ui = manifest.interface;
  const p = `${prefix}.interface`;
  if (!ui || typeof ui !== 'object') {
    errors.push(`${p} must be an object`);
    return;
  }
  for (const field of [
    'displayName',
    'shortDescription',
    'longDescription',
    'developerName',
    'category'
  ]) {
    requireString(errors, ui, field, p);
  }
  const isText = (value) => typeof value === 'string' && value.trim() !== '';
  if (
    !Array.isArray(ui.capabilities) ||
    ui.capabilities.length === 0 ||
    !ui.capabilities.every(isText)
  ) {
    errors.push(`${p}.capabilities must be a non-empty string array`);
  }
  if (
    !Array.isArray(ui.defaultPrompt) ||
    ui.defaultPrompt.length === 0 ||
    ui.defaultPrompt.length > 3 ||
    !ui.defaultPrompt.every(isText)
  ) {
    errors.push(`${p}.defaultPrompt must contain 1 to 3 prompts`);
  }
  for (const field of ['websiteURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    requireHttpsUrl(errors, ui, field, p);
  }
  if (typeof ui.brandColor !== 'string' || !HEX_COLOR_RE.test(ui.brandColor)) {
    errors.push(`${p}.brandColor must use #RRGGBB`);
  }
}

function validateServers(errors, mcp, env, prefix) {
  const servers = mcp?.mcpServers;
  if (!servers || Object.keys(servers).length === 0) {
    errors.push(`${prefix} must list at least one server`);
    return;
  }
  for (const [name, server] of Object.entries(servers)) {
    if (server.type !== 'http') {
      errors.push(`${prefix} ${name}.type must be "http"`);
    }
    if (server.headers) {
      errors.push(`${prefix} ${name} must not set headers`);
    }
    let url;
    try {
      url = new URL(server.url);
    } catch {
      errors.push(`${prefix} ${name}.url must be an absolute URL`);
      continue;
    }
    // Local builds may point at http://localhost; nothing that ships may.
    if (env !== 'local' && url.protocol !== 'https:') {
      errors.push(`${prefix} ${name}.url must use https in ${env}`);
    }
  }
}

function findEntry(errors, marketplace, manifestName, prefix) {
  requireString(errors, marketplace, 'name', prefix);
  const entry = marketplace?.plugins?.find((p) => p.name === manifestName);
  if (!entry) errors.push(`${prefix} must list plugin "${manifestName}"`);
  return entry;
}

function validateSkillFiles(errors, pkg, target, prefix) {
  if (pkg.skills.length === 0) errors.push(`${prefix} ships no skills`);
  for (const file of pkg.skills) {
    if (file.split('/').pop() === '.DS_Store') {
      errors.push(`${prefix} ships skills/${file}`);
    }
  }
  if (target !== 'claude-code') return;
  if (pkg.skills.length > CLAUDE_MAX_FILES) {
    errors.push(
      `${prefix} ships ${pkg.skills.length} skill files (max ${CLAUDE_MAX_FILES})`
    );
  }
  for (const file of pkg.skills) {
    const { size } = statSync(`skills/${file}`);
    if (size > CLAUDE_MAX_FILE_BYTES) {
      errors.push(`${prefix} skills/${file} is ${size} bytes (max 256 KiB)`);
    }
  }
}

function validateOpenAI(errors, warnings, pkg, env, prefix, at) {
  const manifest = at('.codex-plugin/plugin.json');
  validateCommonManifest(errors, manifest, `${prefix} plugin.json`);
  validateCodexInterface(errors, manifest, `${prefix} plugin.json`);
  for (const field of ['apps', 'hooks']) {
    if (manifest[field]) {
      errors.push(
        `${prefix} plugin.json must not set ${field} (OpenAI submission rejects it)`
      );
    }
  }

  const count = Object.keys(at('.mcp.json')?.mcpServers ?? {}).length;
  if (count > OPENAI_MAX_SERVERS) {
    errors.push(
      `${prefix} .mcp.json has ${count} servers; OpenAI connects only ${OPENAI_MAX_SERVERS} per submitted plugin`
    );
  }

  const marketplace = pkg.files['.agents/plugins/marketplace.json'];
  const entry = findEntry(
    errors,
    marketplace,
    manifest.name,
    `${prefix} marketplace.json`
  );
  if (entry) {
    if (
      entry.source?.source !== 'local' ||
      entry.source?.path !== `./${pkg.pluginDir}`
    ) {
      errors.push(
        `${prefix} marketplace source must point at ./${pkg.pluginDir}`
      );
    }
    if (entry.policy?.installation !== 'AVAILABLE') {
      errors.push(
        `${prefix} marketplace policy.installation must be AVAILABLE`
      );
    }
    if (!['ON_INSTALL', 'ON_USE'].includes(entry.policy?.authentication)) {
      errors.push(
        `${prefix} marketplace policy.authentication must be ON_INSTALL or ON_USE`
      );
    }
    requireString(errors, entry, 'category', `${prefix} marketplace entry`);
  }

  if (
    env === 'production' &&
    (!manifest.interface?.composerIcon || !manifest.interface?.logo)
  ) {
    warnings.push(
      `${prefix}: interface.composerIcon and logo are unset; OpenAI submission requires them`
    );
  }
}

function validateClaude(errors, pkg, prefix, at) {
  const manifest = at('.claude-plugin/plugin.json');
  validateCommonManifest(errors, manifest, `${prefix} plugin.json`);
  if (!isDeepStrictEqual(manifest, at('.plugin/plugin.json'))) {
    errors.push(
      `${prefix} .plugin/plugin.json must equal .claude-plugin/plugin.json`
    );
  }
  const marketplace = pkg.files['.claude-plugin/marketplace.json'];
  requireString(
    errors,
    marketplace?.owner,
    'name',
    `${prefix} marketplace.json owner`
  );
  const entry = findEntry(
    errors,
    marketplace,
    manifest.name,
    `${prefix} marketplace.json`
  );
  if (entry && entry.source === undefined) {
    errors.push(`${prefix} marketplace entry needs a source`);
  }
}

function pluginPath(pkg, path) {
  return pkg.pluginDir === '.' ? path : `${pkg.pluginDir}/${path}`;
}

// Staging URLs live only in the gitignored local file, so CI validates the
// staging packages with placeholder URLs. The checks are about structure,
// not about which host a test build points at.
function placeholderUrls(config, target, env) {
  if (env === 'production') return {};
  const overrides = {};
  for (const name of config.targets[target].servers) {
    const urls = config.servers[name];
    const fallbacks =
      env === 'local' ? ['local', 'staging', 'production'] : [env];
    if (!fallbacks.some((key) => urls[key])) {
      overrides[name] = `https://${env}.example.invalid/${name}/mcp`;
    }
  }
  return overrides;
}

function validatePackage(errors, warnings, config, target, env) {
  const prefix = `${target}/${env}`;
  const pkg = render(config, target, env, placeholderUrls(config, target, env));
  const at = (path) => pkg.files[pluginPath(pkg, path)];

  validateServers(errors, at('.mcp.json'), env, `${prefix} .mcp.json`);
  if (target === 'openai') {
    validateOpenAI(errors, warnings, pkg, env, prefix, at);
  } else {
    validateClaude(errors, pkg, prefix, at);
  }
  validateSkillFiles(errors, pkg, target, prefix);
  return pkg;
}

// The plugin directory's files, with the fields a test build may change
// (server URLs, version suffix, display name) replaced by placeholders.
// Marketplace files are excluded: they differ by design (name, source).
function normalizedPlugin(pkg) {
  const files = {};
  for (const [path, object] of Object.entries(pkg.files)) {
    if (path.endsWith('marketplace.json')) continue;
    const rel =
      pkg.pluginDir === '.' ? path : path.slice(pkg.pluginDir.length + 1);
    const copy = structuredClone(object);
    if (copy.version) copy.version = '<version>';
    if (copy.interface?.displayName) {
      copy.interface.displayName = '<displayName>';
    }
    if (copy.mcpServers && typeof copy.mcpServers === 'object') {
      for (const server of Object.values(copy.mcpServers)) server.url = '<url>';
    }
    files[rel] = copy;
  }
  return { files, skills: pkg.skills };
}

function manifestVersion(pkg) {
  const path = Object.keys(pkg.files).find(
    (p) => p.endsWith('plugin.json') && !p.endsWith('marketplace.json')
  );
  return pkg.files[path].version;
}

function validateConsistency(errors, target, packages) {
  const production = normalizedPlugin(packages.production);
  const prodPaths = Object.keys(production.files).sort();
  for (const env of ENVS.filter((e) => e !== 'production')) {
    const prefix = `${target}/${env}`;
    const test = normalizedPlugin(packages[env]);
    if (!isDeepStrictEqual(Object.keys(test.files).sort(), prodPaths)) {
      errors.push(`${prefix} has different plugin files than production`);
      continue;
    }
    for (const path of prodPaths) {
      if (!isDeepStrictEqual(test.files[path], production.files[path])) {
        errors.push(
          `${prefix} ${path} differs from production beyond URLs and test labels`
        );
      }
    }
    if (!isDeepStrictEqual(test.skills, production.skills)) {
      errors.push(`${prefix} ships different skill files than production`);
    }
    const base = manifestVersion(packages.production);
    if (!manifestVersion(packages[env]).startsWith(`${base}-`)) {
      errors.push(`${prefix} version must be ${base}-<label>`);
    }
  }
}

function validateConfig(errors, warnings, config) {
  for (const [name, urls] of Object.entries(config.servers)) {
    if (!urls.production) errors.push(`servers.${name} needs a production URL`);
  }
  for (const target of TARGETS) {
    const packages = {};
    for (const env of ENVS) {
      packages[env] = validatePackage(errors, warnings, config, target, env);
    }
    validateConsistency(errors, target, packages);
  }
}

async function main() {
  const errors = [];
  const warnings = [];

  // The committed config alone (what CI sees), then with the local overlay
  // when one exists, so a bad staging URL is caught before a QA run.
  validateConfig(errors, warnings, await loadConfig(undefined, null));
  if (existsSync(LOCAL_CONFIG_PATH)) {
    const localErrors = [];
    validateConfig(localErrors, [], await loadConfig());
    errors.push(...localErrors.map((e) => `(with ${LOCAL_CONFIG_PATH}) ${e}`));
  }

  for (const warning of warnings) console.warn(`warning: ${warning}`);
  if (errors.length > 0) {
    console.error('Plugin validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `Plugin validation passed (${TARGETS.join(', ')} x ${ENVS.join(', ')})`
  );
}

main().catch((error) => {
  console.error(`Plugin validation failed: ${error.message}`);
  process.exit(1);
});
