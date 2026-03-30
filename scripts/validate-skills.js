#!/usr/bin/env node

import { readdir, readFile, access } from 'fs/promises';
import { join } from 'path';

const SKILLS_DIR = 'skills';
const NAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MAX_NAME_LEN = 64;
const MAX_DESC_LEN = 1024;
const MAX_SKILL_LINES = 500;

/**
 * Parse YAML frontmatter from markdown content.
 * Returns null if no frontmatter block is found.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) meta[key] = val;
  }
  return meta;
}

/** Check a file exists */
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Validate a single skill directory. Returns an array of error strings. */
async function validateSkill(skillPath, dirName) {
  const errors = [];

  // 1. SKILL.md must exist
  const skillMdPath = join(skillPath, 'SKILL.md');
  if (!(await exists(skillMdPath))) {
    errors.push('SKILL.md is missing');
    return errors; // can't validate further
  }

  const content = await readFile(skillMdPath, 'utf8');

  // 2. Frontmatter must exist with name + description
  const meta = parseFrontmatter(content);
  if (!meta) {
    errors.push('SKILL.md has no YAML frontmatter');
    return errors;
  }

  if (!meta.name) {
    errors.push('frontmatter missing required field: name');
  } else {
    if (meta.name !== dirName) {
      errors.push(
        `frontmatter name "${meta.name}" does not match directory "${dirName}"`
      );
    }
    if (!NAME_RE.test(meta.name)) {
      errors.push(
        `name "${meta.name}" must be lowercase alphanumeric with hyphens, no leading/trailing/consecutive hyphens`
      );
    }
    if (meta.name.includes('--')) {
      errors.push(`name "${meta.name}" contains consecutive hyphens`);
    }
    if (meta.name.length > MAX_NAME_LEN) {
      errors.push(`name is ${meta.name.length} chars (max ${MAX_NAME_LEN})`);
    }
  }

  if (!meta.description) {
    errors.push('frontmatter missing required field: description');
  } else if (meta.description.length > MAX_DESC_LEN) {
    errors.push(
      `description is ${meta.description.length} chars (max ${MAX_DESC_LEN})`
    );
  }

  // 3. SKILL.md line count warning
  const lineCount = content.split('\n').length;
  if (lineCount > MAX_SKILL_LINES) {
    errors.push(
      `SKILL.md is ${lineCount} lines (recommended max ${MAX_SKILL_LINES}) — consider splitting into references/`
    );
  }

  // 4. evals/evals.json must exist and be valid
  const evalsPath = join(skillPath, 'evals', 'evals.json');
  if (!(await exists(evalsPath))) {
    errors.push('evals/evals.json is missing');
  } else {
    try {
      const evalsContent = await readFile(evalsPath, 'utf8');
      const evalsData = JSON.parse(evalsContent);

      if (!evalsData.skill_name) {
        errors.push('evals.json missing skill_name');
      } else if (evalsData.skill_name !== dirName) {
        errors.push(
          `evals.json skill_name "${evalsData.skill_name}" does not match directory "${dirName}"`
        );
      }

      if (!Array.isArray(evalsData.evals)) {
        errors.push('evals.json missing evals array');
      } else {
        if (evalsData.evals.length < 3) {
          errors.push(
            `evals.json has ${evalsData.evals.length} evals (minimum 3)`
          );
        }
        for (const ev of evalsData.evals) {
          if (!ev.id) errors.push(`eval missing id`);
          if (!ev.prompt) errors.push(`eval ${ev.id ?? '?'} missing prompt`);
          if (!Array.isArray(ev.expectations) || ev.expectations.length === 0) {
            errors.push(`eval ${ev.id ?? '?'} missing or empty expectations`);
          }
        }
      }
    } catch (e) {
      errors.push(`evals/evals.json is not valid JSON: ${e.message}`);
    }
  }

  // 5. Validate references: files mentioned in SKILL.md must exist on disk
  //    Match both `references/foo.md` and [references/foo.md](references/foo.md)
  const refMentions = [
    ...content.matchAll(/`references\/([^`]+\.md)`/g),
    ...content.matchAll(/\(references\/([^)]+\.md)\)/g),
    ...content.matchAll(/references\/([a-z0-9-]+\.md)/g)
  ].map((m) => m[1]);
  const uniqueRefs = [...new Set(refMentions)];

  for (const ref of uniqueRefs) {
    const refPath = join(skillPath, 'references', ref);
    if (!(await exists(refPath))) {
      errors.push(
        `SKILL.md references "references/${ref}" but the file does not exist`
      );
    }
  }

  // 6. Check that reference files on disk are mentioned in SKILL.md
  const refsDir = join(skillPath, 'references');
  if (await exists(refsDir)) {
    const refFiles = await readdir(refsDir);
    const mdFiles = refFiles.filter((f) => f.endsWith('.md'));
    for (const file of mdFiles) {
      if (!uniqueRefs.includes(file)) {
        errors.push(
          `references/${file} exists but is not referenced in SKILL.md`
        );
      }
    }
  }

  return errors;
}

async function main() {
  let hasErrors = false;

  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries.filter((e) => e.isDirectory());

  if (skillDirs.length === 0) {
    console.error('❌ No skill directories found in skills/');
    process.exit(1);
  }

  console.log(`Found ${skillDirs.length} skill directories\n`);

  for (const dir of skillDirs) {
    const skillPath = join(SKILLS_DIR, dir.name);
    console.log(`Validating ${dir.name}...`);

    const errors = await validateSkill(skillPath, dir.name);
    if (errors.length > 0) {
      hasErrors = true;
      for (const err of errors) {
        console.error(`  ❌ ${err}`);
      }
    } else {
      console.log(`  ✅ Valid`);
    }
    console.log();
  }

  if (hasErrors) {
    console.error('❌ Skill validation failed');
    process.exit(1);
  }

  console.log('✅ All skills are valid');
}

main();
