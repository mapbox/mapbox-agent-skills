#!/usr/bin/env node

import { cp, mkdir, rm } from 'fs/promises';

const pluginRoot = 'plugins/mapbox';

async function main() {
  await mkdir(pluginRoot, { recursive: true });
  await rm(`${pluginRoot}/skills`, { recursive: true, force: true });
  await rm(`${pluginRoot}/.mcp.json`, { force: true });

  await cp('skills', `${pluginRoot}/skills`, { recursive: true });
  await cp('.mcp.json', `${pluginRoot}/.mcp.json`);

  console.log(`Built Codex plugin package at ${pluginRoot}`);
}

main().catch((error) => {
  console.error(`Failed to build Codex plugin package: ${error.message}`);
  process.exit(1);
});
