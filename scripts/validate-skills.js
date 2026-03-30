#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

/**
 * Validates all skills using the official skills-ref validator
 * See: https://agentskills.io/specification
 */
async function validateSkills() {
  const skillsDir = 'skills';
  let hasErrors = false;

  const entries = await readdir(skillsDir, { withFileTypes: true });
  const skillDirs = entries.filter((entry) => entry.isDirectory());

  if (skillDirs.length === 0) {
    console.error('❌ No skill directories found in skills/');
    process.exit(1);
  }

  console.log(`Found ${skillDirs.length} skill directories\n`);

  for (const dir of skillDirs) {
    const skillPath = join(skillsDir, dir.name);
    console.log(`Validating ${dir.name}...`);

    try {
      execSync(`npx skills-ref validate ${skillPath}`, {
        stdio: 'pipe',
      });
      console.log(`  ✅ Valid\n`);
    } catch (error) {
      const stderr = error.stderr?.toString() || '';
      const stdout = error.stdout?.toString() || '';
      const output = (stdout + stderr).trim();
      console.error(`  ❌ ${output}\n`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('❌ Skill validation failed');
    process.exit(1);
  }

  console.log('✅ All skills are valid');
}

validateSkills();
