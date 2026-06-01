#!/usr/bin/env node

import { access, readFile } from 'fs/promises';

const SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const HEX_COLOR_RE = /^#[0-9A-F]{6}$/i;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

function requireString(errors, object, field, prefix = '') {
  const value = object[field];
  const name = prefix ? `${prefix}.${field}` : field;
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${name} must be a non-empty string`);
    return undefined;
  }
  return value;
}

function requireHttpsUrl(errors, object, field, prefix = '') {
  const value = requireString(errors, object, field, prefix);
  if (!value) return;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      errors.push(`${prefix}.${field} must use https`);
    }
  } catch {
    errors.push(`${prefix}.${field} must be an absolute URL`);
  }
}

function validateManifest(errors, manifest) {
  requireString(errors, manifest, 'name');
  const version = requireString(errors, manifest, 'version');
  if (version && !SEMVER_RE.test(version)) {
    errors.push('version must be strict semver');
  }
  requireString(errors, manifest, 'description');

  if (!manifest.author || typeof manifest.author !== 'object') {
    errors.push('author must be an object');
  } else {
    requireString(errors, manifest.author, 'name', 'author');
    requireHttpsUrl(errors, manifest.author, 'url', 'author');
  }

  if (manifest.skills !== './skills/') {
    errors.push('skills must be "./skills/"');
  }
  if (manifest.mcpServers !== './.mcp.json') {
    errors.push('mcpServers must be "./.mcp.json"');
  }

  if (!manifest.interface || typeof manifest.interface !== 'object') {
    errors.push('interface must be an object');
    return;
  }

  for (const field of [
    'displayName',
    'shortDescription',
    'longDescription',
    'developerName',
    'category'
  ]) {
    requireString(errors, manifest.interface, field, 'interface');
  }

  if (
    !Array.isArray(manifest.interface.capabilities) ||
    manifest.interface.capabilities.length === 0 ||
    !manifest.interface.capabilities.every(
      (value) => typeof value === 'string' && value.trim() !== ''
    )
  ) {
    errors.push('interface.capabilities must be a non-empty string array');
  }

  if (
    !Array.isArray(manifest.interface.defaultPrompt) ||
    manifest.interface.defaultPrompt.length === 0 ||
    manifest.interface.defaultPrompt.length > 3
  ) {
    errors.push('interface.defaultPrompt must contain 1 to 3 prompts');
  }

  for (const field of ['websiteURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    requireHttpsUrl(errors, manifest.interface, field, 'interface');
  }

  if (
    typeof manifest.interface.brandColor !== 'string' ||
    !HEX_COLOR_RE.test(manifest.interface.brandColor)
  ) {
    errors.push('interface.brandColor must use #RRGGBB');
  }
}

function validateMarketplace(errors, marketplace, pluginName) {
  requireString(errors, marketplace, 'name');
  if (!Array.isArray(marketplace.plugins)) {
    errors.push('marketplace plugins must be an array');
    return;
  }

  const plugin = marketplace.plugins.find((entry) => entry.name === pluginName);
  if (!plugin) {
    errors.push(`marketplace must include plugin "${pluginName}"`);
    return;
  }

  if (
    plugin.source?.source !== 'local' ||
    plugin.source?.path !== './plugins/mapbox'
  ) {
    errors.push('marketplace source must point at ./plugins/mapbox');
  }
  if (plugin.policy?.installation !== 'AVAILABLE') {
    errors.push('marketplace policy.installation must be AVAILABLE');
  }
  if (!['ON_INSTALL', 'ON_USE'].includes(plugin.policy?.authentication)) {
    errors.push(
      'marketplace policy.authentication must be ON_INSTALL or ON_USE'
    );
  }
  requireString(errors, plugin, 'category', 'marketplace.plugins[0]');
}

async function main() {
  const errors = [];
  const pluginRoot = 'plugins/mapbox';

  for (const path of [
    `${pluginRoot}/.codex-plugin/plugin.json`,
    '.agents/plugins/marketplace.json',
    `${pluginRoot}/.mcp.json`,
    `${pluginRoot}/skills`
  ]) {
    if (!(await exists(path))) {
      errors.push(`${path} is required`);
    }
  }

  if (errors.length === 0) {
    const manifest = await readJson(`${pluginRoot}/.codex-plugin/plugin.json`);
    const marketplace = await readJson('.agents/plugins/marketplace.json');
    validateManifest(errors, manifest);
    validateMarketplace(errors, marketplace, manifest.name);
  }

  if (errors.length > 0) {
    console.error('Codex plugin validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Codex plugin validation passed');
}

main().catch((error) => {
  console.error(`Codex plugin validation failed: ${error.message}`);
  process.exit(1);
});
