#!/usr/bin/env node
/**
 * Generates metrics/metrics-latest.md and a dated snapshot in metrics/.
 *
 * Requires:
 *   - GITHUB_TOKEN env var with repo traffic read access (or gh CLI auth)
 *   - Network access to skills.sh
 *
 * Usage:
 *   node scripts/generate-metrics-report.js
 *   GITHUB_TOKEN=$(gh auth token) node scripts/generate-metrics-report.js
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const REPO = 'mapbox/mapbox-agent-skills';
const SKILLS_SH_API = 'https://www.skills.sh/api/search?q=mapbox';

// ── GitHub helpers ────────────────────────────────────────────────────────────

async function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const { execSync } = await import('child_process');
  try {
    return execSync('gh auth token', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error(
      'No GitHub token found. Set GITHUB_TOKEN or run `gh auth login`.'
    );
  }
}

async function ghFetch(path, token) {
  const res = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status}`);
  return res.json();
}

// ── skills.sh helper ──────────────────────────────────────────────────────────

async function fetchSkillsShInstalls() {
  const res = await fetch(SKILLS_SH_API);
  if (!res.ok) throw new Error(`skills.sh API → ${res.status}`);
  const { skills } = await res.json();
  return skills
    .filter((s) => s.source === REPO)
    .sort((a, b) => b.installs - a.installs);
}

// ── Formatting helpers ────────────────────────────────────────────────────────

// "2026-05-21T00:00:00Z" → "5/21/2026"
function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
}

// 1579 → "1,579"
function fmtNum(n) {
  return n.toLocaleString('en-US');
}

// ── Report builder ────────────────────────────────────────────────────────────

function buildReport({ repoMeta, views, clones, topPaths, topReferrers, skillsShInstalls, generatedDate }) {
  const totalInstalls = skillsShInstalls.reduce((a, s) => a + s.installs, 0);
  const skillColW = Math.max(...skillsShInstalls.map((s) => s.name.length), 36);

  const viewRows = views.views
    .map((v) => `| ${fmtDate(v.timestamp).padEnd(9)} | ${String(v.count).padEnd(5)} | ${String(v.uniques).padEnd(15)} |`)
    .join('\n');

  const referrerRows = topReferrers
    .map((r, i) => `${i + 1}. **${r.referrer}** - ${r.count} views (${r.uniques} unique)`)
    .join('\n');

  const pathRows = topPaths
    .map((p, i) => `${i + 1}. \`${p.path}\` - ${p.count} views (${p.uniques} unique)`)
    .join('\n');

  const skillRows = skillsShInstalls
    .map((s) => `| ${s.name.padEnd(skillColW)} | N/A        | ${String(s.installs).padEnd(8)} |`)
    .join('\n');

  return `# Mapbox Agent Skills - Metrics Report

**Generated:** ${generatedDate}

## Repository Stats

- ⭐ **Stars:** ${repoMeta.stargazers_count}
- 🍴 **Forks:** ${repoMeta.forks_count}
- 👀 **Watchers:** ${repoMeta.watchers_count}
- 🔀 **Open PRs:** ${repoMeta.open_issues_count}
- 🐛 **Open Issues:** 0

## Traffic (Last 14 Days)

### Views

- **Total Views:** ${fmtNum(views.count)}
- **Unique Visitors:** ${fmtNum(views.uniques)}

### Clones

- **Total Clones:** ${fmtNum(clones.count)}
- **Unique Cloners:** ${fmtNum(clones.uniques)}

## Daily Views Breakdown

| Date      | Views | Unique Visitors |
| --------- | ----- | --------------- |
${viewRows}

## Top Referrers

${referrerRows}

## Popular Content

${pathRows}

## Skills.sh Metrics

✅ **Status:** ${skillsShInstalls.length} unique skill(s) found
**Total Installs:** ${fmtNum(totalInstalls)}

### Published Skills

| ${'Skill'.padEnd(skillColW)} | Repository | Installs |
| ${'-'.repeat(skillColW)} | ---------- | -------- |
${skillRows}

---

_Report generated automatically by \`scripts/generate-metrics-report.js\`_
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching data…');

  const token = await githubToken();

  const [repoMeta, views, clones, topPaths, topReferrers, skillsShInstalls] =
    await Promise.all([
      ghFetch(`repos/${REPO}`, token),
      ghFetch(`repos/${REPO}/traffic/views`, token),
      ghFetch(`repos/${REPO}/traffic/clones`, token),
      ghFetch(`repos/${REPO}/traffic/popular/paths`, token),
      ghFetch(`repos/${REPO}/traffic/popular/referrers`, token),
      fetchSkillsShInstalls(),
    ]);

  const totalInstalls = skillsShInstalls.reduce((a, s) => a + s.installs, 0);
  console.log(`  GitHub traffic: ${views.count} views, ${clones.count} clones (last 14d)`);
  console.log(`  skills.sh: ${skillsShInstalls.length} skills, ${totalInstalls} total installs`);

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const dateSlug = new Date().toISOString().slice(0, 10);

  const report = buildReport({ repoMeta, views, clones, topPaths, topReferrers, skillsShInstalls, generatedDate });

  await mkdir('metrics', { recursive: true });
  await writeFile(join('metrics', 'metrics-latest.md'), report);
  await writeFile(join('metrics', `metrics-${dateSlug}.md`), report);

  console.log(`\nWrote:`);
  console.log(`  metrics/metrics-latest.md`);
  console.log(`  metrics/metrics-${dateSlug}.md`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
