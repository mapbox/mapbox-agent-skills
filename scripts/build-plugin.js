#!/usr/bin/env node

// Builds the Mapbox plugin packages from plugin.config.json.
//
//   node scripts/build-plugin.js                 # production, all targets
//   node scripts/build-plugin.js --check         # fail if committed manifests drift from config
//   node scripts/build-plugin.js --env staging   # test packages in dist/staging/<target>/
//   node scripts/build-plugin.js --env local --target openai \
//     --url mapbox=https://<id>.ngrok.app/mcp    # point one server somewhere else
//
// Production writes the committed manifests (and the gitignored
// plugins/mapbox/ copies). Staging and local write only under dist/.

import { execFileSync } from 'child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { parseArgs } from 'util';
import {
  ENVS,
  TARGETS,
  formatJson,
  loadConfig,
  parseUrlOverrides,
  render
} from './plugin-config.js';

function trackedFiles() {
  return new Set(
    execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  );
}

async function readOrNull(path) {
  try {
    return await readFile(path, 'utf8');
  } catch {
    return null;
  }
}

async function check(config, targets) {
  const tracked = trackedFiles();
  const drift = [];
  for (const target of targets) {
    const pkg = render(config, target, 'production');
    for (const [path, object] of Object.entries(pkg.files)) {
      if (!tracked.has(path)) continue; // gitignored, regenerated on build
      const expected = await formatJson(object, path);
      if ((await readOrNull(path)) !== expected) drift.push(path);
    }
  }
  if (drift.length > 0) {
    console.error(
      'These files are generated from plugin.config.json but differ from it:'
    );
    for (const path of drift) console.error(`- ${path}`);
    console.error('Edit plugin.config.json, then run npm run build:plugin.');
    process.exit(1);
  }
  console.log('Generated plugin manifests match plugin.config.json');
}

async function build(config, target, env, overrides) {
  const pkg = render(config, target, env, overrides);
  if (env !== 'production') {
    await rm(pkg.outRoot, { recursive: true, force: true });
  }

  for (const [path, object] of Object.entries(pkg.files)) {
    const out = join(pkg.outRoot, path);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, await formatJson(object, out));
  }

  if (pkg.copySkills) {
    const skillsOut = join(pkg.outRoot, pkg.pluginDir, 'skills');
    await rm(skillsOut, { recursive: true, force: true });
    for (const file of pkg.skills) {
      const out = join(skillsOut, file);
      await mkdir(dirname(out), { recursive: true });
      await cp(join('skills', file), out);
    }
  }

  const mcp = pkg.files[join(pkg.pluginDir, '.mcp.json')];
  const market = Object.values(pkg.files).find((file) => file.plugins);
  console.log(`\n${target} (${env}) -> ${join(pkg.outRoot, pkg.pluginDir)}`);
  console.log(`  ${pkg.skills.length} skill files`);
  for (const [name, server] of Object.entries(mcp.mcpServers)) {
    console.log(`  ${name}: ${server.url}`);
  }
  if (env !== 'production') {
    console.log(
      `  marketplace: ${pkg.outRoot} (install ${config.name}@${market.name})`
    );
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      target: { type: 'string', default: 'all' },
      env: { type: 'string', default: 'production' },
      url: { type: 'string', multiple: true, default: [] },
      check: { type: 'boolean', default: false }
    }
  });

  const targets = values.target === 'all' ? TARGETS : [values.target];
  if (!targets.every((target) => TARGETS.includes(target))) {
    throw new Error(`--target must be one of ${TARGETS.join(', ')}, all`);
  }
  if (!ENVS.includes(values.env)) {
    throw new Error(`--env must be one of ${ENVS.join(', ')}`);
  }
  if (values.env === 'production' && values.url.length > 0) {
    throw new Error('--url only applies to staging or local builds');
  }
  const overrides = parseUrlOverrides(values.url);

  const config = await loadConfig();
  for (const name of Object.keys(overrides)) {
    if (!config.servers[name]) {
      throw new Error(
        `--url ${name}=...: unknown server (known: ${Object.keys(config.servers).join(', ')})`
      );
    }
  }
  if (values.check) {
    if (values.env !== 'production') {
      throw new Error('--check only compares the committed production files');
    }
    await check(config, targets);
    return;
  }
  for (const target of targets) {
    // An override only applies to the targets that ship that server.
    const applicable = Object.fromEntries(
      Object.entries(overrides).filter(([name]) =>
        config.targets[target].servers.includes(name)
      )
    );
    if (
      values.target !== 'all' &&
      Object.keys(applicable).length !== Object.keys(overrides).length
    ) {
      render(config, target, values.env, overrides); // throws a clear error
    }
    await build(config, target, values.env, applicable);
  }
}

main().catch((error) => {
  console.error(`Plugin build failed: ${error.message}`);
  process.exit(1);
});
