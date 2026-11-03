// Renders every Mapbox plugin package from plugin.config.json.
//
// One function, render(), produces both the submission (production) package
// and the staging/local test packages, so a test build can only differ from
// what ships in the fields this file labels: server URLs, the version suffix,
// the display name and the marketplace it is installed from.

import { execFileSync } from 'child_process';
import { readFile } from 'fs/promises';
import * as prettier from 'prettier';

export const CONFIG_PATH = 'plugin.config.json';
// Gitignored. Holds server URLs that must not be committed to this public
// repo (staging hosts): { "servers": { "<name>": { "staging": "https://..." } } }
export const LOCAL_CONFIG_PATH = 'plugin.config.local.json';
export const TARGETS = ['openai', 'claude-code'];
export const ENVS = ['production', 'staging', 'local'];

const ENV_LABELS = { staging: 'staging', local: 'local' };

// Loads plugin.config.json, overlaid with plugin.config.local.json server URLs
// when that file exists (pass localPath: null to ignore it).
export async function loadConfig(
  path = CONFIG_PATH,
  localPath = LOCAL_CONFIG_PATH
) {
  const config = JSON.parse(await readFile(path, 'utf8'));
  if (!localPath) return config;
  let local;
  try {
    local = JSON.parse(await readFile(localPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return config;
    throw new Error(`${localPath}: ${error.message}`);
  }
  for (const [name, urls] of Object.entries(local.servers ?? {})) {
    if (!config.servers[name]) {
      throw new Error(`${localPath}: unknown server "${name}"`);
    }
    if ('production' in urls) {
      throw new Error(
        `${localPath}: production URLs belong in ${path}, not the local file`
      );
    }
    config.servers[name] = { ...config.servers[name], ...urls };
  }
  return config;
}

// Which server URL each env uses. `local` falls back to staging, then
// production, for servers you are not running locally.
const ENV_FALLBACK = {
  production: ['production'],
  staging: ['staging'],
  local: ['local', 'staging', 'production']
};

export function resolveServers(config, target, env, overrides = {}) {
  const names = config.targets[target].servers;
  for (const name of Object.keys(overrides)) {
    if (!names.includes(name)) {
      throw new Error(
        `--url ${name}=... does not apply: the ${target} package only has ${names.join(', ')}`
      );
    }
  }
  const servers = {};
  for (const name of names) {
    const urls = config.servers[name];
    if (!urls) throw new Error(`Unknown server "${name}" in targets.${target}`);
    const url =
      overrides[name] ??
      ENV_FALLBACK[env].map((key) => urls[key]).find((value) => value);
    if (!url) {
      throw new Error(
        `Server "${name}" has no ${env} URL. Set servers.${name}.${env} in ${LOCAL_CONFIG_PATH} or pass --url ${name}=<url>`
      );
    }
    servers[name] = { type: 'http', url };
  }
  return servers;
}

// Tracked files only, so the package matches what GitHub serves (no
// .DS_Store, no local scratch files).
export function listSkillFiles(config, target) {
  const { excludeFiles, excludeDirs } = config.targets[target].skills;
  const out = execFileSync('git', ['ls-files', '-z', 'skills'], {
    encoding: 'utf8'
  });
  return out
    .split('\0')
    .filter(Boolean)
    .map((path) => path.slice('skills/'.length))
    .filter((path) => !excludeFiles.includes(path))
    .filter((path) => {
      const dirs = path.split('/').slice(0, -1);
      return !dirs.some((dir) => excludeDirs.includes(dir));
    })
    .sort();
}

function label(env) {
  return ENV_LABELS[env];
}

function versionFor(config, env) {
  return label(env) ? `${config.version}-${label(env)}` : config.version;
}

function marketplaceName(base, env) {
  return label(env) ? `mapbox-${label(env)}` : base;
}

function baseManifest(config, env) {
  return {
    name: config.name,
    version: versionFor(config, env),
    description: config.description,
    author: config.author,
    homepage: config.homepage,
    repository: config.repository,
    license: config.license,
    keywords: config.keywords,
    skills: './skills/',
    mcpServers: './.mcp.json'
  };
}

// Returns { outRoot, pluginDir, files, skills, copySkills }.
//   outRoot   - directory everything is written under ('.' for production)
//   pluginDir - the plugin root, relative to outRoot
//   files     - { pathRelativeToOutRoot: jsonObject }
//   skills    - skill file paths (relative to skills/) the package contains
//   copySkills- false when the plugin root IS the repo root
export function render(config, target, env, overrides = {}) {
  if (!TARGETS.includes(target)) throw new Error(`Unknown target ${target}`);
  if (!ENVS.includes(env)) throw new Error(`Unknown env ${env}`);

  const targetConfig = config.targets[target];
  const mcp = { mcpServers: resolveServers(config, target, env, overrides) };
  const skills = listSkillFiles(config, target);
  const production = env === 'production';

  if (target === 'openai') {
    const outRoot = production ? '.' : `dist/${env}/openai`;
    const pluginDir = 'plugins/mapbox';
    const market = targetConfig.marketplace;
    const displaySuffix = label(env) ? ` (${label(env)})` : '';
    return {
      outRoot,
      pluginDir,
      skills,
      copySkills: true,
      files: {
        [`${pluginDir}/.codex-plugin/plugin.json`]: {
          ...baseManifest(config, env),
          interface: {
            ...targetConfig.interface,
            displayName: targetConfig.interface.displayName + displaySuffix
          }
        },
        [`${pluginDir}/.mcp.json`]: mcp,
        '.agents/plugins/marketplace.json': {
          name: marketplaceName(market.name, env),
          interface: { displayName: market.displayName + displaySuffix },
          plugins: [
            {
              name: config.name,
              source: { source: 'local', path: `./${pluginDir}` },
              policy: market.policy,
              category: market.category
            }
          ]
        }
      }
    };
  }

  // claude-code: production is the GitHub repo root itself.
  const market = targetConfig.marketplace;
  const outRoot = production ? '.' : `dist/${env}/claude-code`;
  const pluginDir = production ? '.' : config.name;
  const manifest = baseManifest(config, env);
  const prefix = pluginDir === '.' ? '' : `${pluginDir}/`;
  return {
    outRoot,
    pluginDir,
    skills,
    copySkills: !production,
    files: {
      [`${prefix}.claude-plugin/plugin.json`]: manifest,
      [`${prefix}.plugin/plugin.json`]: manifest,
      [`${prefix}.mcp.json`]: mcp,
      '.claude-plugin/marketplace.json': {
        name: marketplaceName(market.name, env),
        owner: market.owner,
        metadata: {
          description: market.description,
          version: versionFor(config, env)
        },
        plugins: [
          {
            name: config.name,
            description: config.description,
            source: production
              ? { source: 'github', repo: market.githubRepo }
              : `./${pluginDir}`,
            keywords: config.keywords
          }
        ]
      }
    }
  };
}

// Formats JSON exactly as `prettier --check` expects, so generated files pass
// format:check and --check comparisons are stable.
export async function formatJson(object, path) {
  const options = (await prettier.resolveConfig(path)) ?? {};
  return prettier.format(JSON.stringify(object, null, 2), {
    ...options,
    filepath: path
  });
}

export function parseUrlOverrides(values) {
  const overrides = {};
  for (const value of values) {
    const index = value.indexOf('=');
    if (index <= 0) throw new Error(`--url expects name=url, got "${value}"`);
    const name = value.slice(0, index);
    const url = value.slice(index + 1);
    new URL(url); // throws on a malformed URL
    overrides[name] = url;
  }
  return overrides;
}
