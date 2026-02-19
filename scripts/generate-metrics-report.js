#!/usr/bin/env node

/**
 * Metrics Report Generator for Mapbox Agent Skills
 *
 * Generates a comprehensive metrics report combining:
 * - GitHub traffic data (views, clones, referrers, popular paths)
 * - Repository stats (stars, forks, watchers)
 * - Skills.sh data (when available)
 *
 * Usage:
 *   node scripts/generate-metrics-report.js [--format json|markdown|csv]
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const REPO = 'mapbox/mapbox-agent-skills';
const OUTPUT_DIR = 'metrics';

// Helper to run gh API commands
function ghApi(endpoint) {
  try {
    const result = execSync(`gh api ${endpoint}`, { encoding: 'utf-8' });
    return JSON.parse(result);
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

// Fetch GitHub traffic data
async function fetchGitHubMetrics() {
  console.log('📊 Fetching GitHub metrics...');

  const views = ghApi(`/repos/${REPO}/traffic/views`);
  const clones = ghApi(`/repos/${REPO}/traffic/clones`);
  const referrers = ghApi(`/repos/${REPO}/traffic/popular/referrers`);
  const paths = ghApi(`/repos/${REPO}/traffic/popular/paths`);
  const repo = ghApi(`/repos/${REPO}`);

  return {
    timestamp: new Date().toISOString(),
    repository: {
      name: REPO,
      stars: repo?.stargazers_count || 0,
      forks: repo?.forks_count || 0,
      watchers: repo?.subscribers_count || 0,
      open_issues: repo?.open_issues_count || 0
    },
    traffic: {
      views: {
        total: views?.count || 0,
        unique: views?.uniques || 0,
        daily: views?.views || []
      },
      clones: {
        total: clones?.count || 0,
        unique: clones?.uniques || 0,
        daily: clones?.clones || []
      }
    },
    referrers: referrers || [],
    popular_paths: paths || []
  };
}

// Fetch skills.sh data using the API
async function fetchSkillsShMetrics() {
  console.log('🔍 Checking skills.sh metrics...');

  try {
    // Use the skills.sh API to search for mapbox skills
    const result = execSync(`curl -s "https://skills.sh/api/search?q=mapbox"`, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10
    });

    const data = JSON.parse(result);

    if (!data.skills || data.skills.length === 0) {
      return {
        status: 'not_found',
        note: 'No mapbox skills found on skills.sh',
        skills: []
      };
    }

    // Process and deduplicate skills
    const skillsMap = new Map();

    data.skills.forEach((skill, index) => {
      const name = skill.name || 'Unknown';
      const installs = skill.installs || 0;
      const owner = skill.owner || '';
      const repo = skill.repo || '';
      const fullPath = owner && repo ? `${owner}/${repo}` : '';

      // Deduplicate by name, keeping the one with more installs
      if (!skillsMap.has(name) || skillsMap.get(name).installs < installs) {
        skillsMap.set(name, {
          rank: index + 1,
          name: name,
          owner: owner,
          repo: repo,
          path: fullPath,
          installs: installs,
          installsFormatted: installs.toString()
        });
      }
    });

    // Convert map to sorted array
    const skillsData = Array.from(skillsMap.values()).sort(
      (a, b) => b.installs - a.installs
    );

    console.log(
      `   Found ${skillsData.length} unique mapbox skill(s) on skills.sh`
    );
    return {
      status: 'published',
      count: skillsData.length,
      skills: skillsData,
      totalInstalls: skillsData.reduce((sum, skill) => sum + skill.installs, 0)
    };
  } catch (error) {
    console.warn('   Unable to fetch skills.sh data:', error.message);
    return {
      status: 'error',
      note: `Failed to fetch: ${error.message}`,
      skills: []
    };
  }
}

// Generate markdown report
function generateMarkdownReport(data) {
  const { timestamp, repository, traffic, referrers, popular_paths } = data;
  const date = new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `# Mapbox Agent Skills - Metrics Report

**Generated:** ${date}

## Repository Stats

- ⭐ **Stars:** ${repository.stars.toLocaleString()}
- 🍴 **Forks:** ${repository.forks.toLocaleString()}
- 👀 **Watchers:** ${repository.watchers.toLocaleString()}
- 🐛 **Open Issues:** ${repository.open_issues.toLocaleString()}

## Traffic (Last 14 Days)

### Views
- **Total Views:** ${traffic.views.total.toLocaleString()}
- **Unique Visitors:** ${traffic.views.unique.toLocaleString()}

### Clones
- **Total Clones:** ${traffic.clones.total.toLocaleString()}
- **Unique Cloners:** ${traffic.clones.unique.toLocaleString()}

## Daily Views Breakdown

| Date | Views | Unique Visitors |
|------|-------|-----------------|
${traffic.views.daily
  .map((day) => {
    const date = new Date(day.timestamp).toLocaleDateString();
    return `| ${date} | ${day.count} | ${day.uniques} |`;
  })
  .join('\n')}

## Top Referrers

${
  referrers.length > 0
    ? referrers
        .slice(0, 10)
        .map(
          (ref, i) =>
            `${i + 1}. **${ref.referrer}** - ${ref.count} views (${ref.uniques} unique)`
        )
        .join('\n')
    : '_No referrer data available_'
}

## Popular Content

${
  popular_paths.length > 0
    ? popular_paths
        .slice(0, 10)
        .map(
          (path, i) =>
            `${i + 1}. \`${path.path}\` - ${path.count} views (${path.uniques} unique)`
        )
        .join('\n')
    : '_No path data available_'
}

## Skills.sh Metrics

${
  data.skillssh.status === 'published'
    ? `✅ **Status:** ${data.skillssh.count} unique skill(s) found\n**Total Installs:** ${data.skillssh.totalInstalls.toLocaleString()}\n\n### Published Skills\n\n| Skill | Repository | Installs |\n|-------|------------|----------|\n${data.skillssh.skills
        .map(
          (skill) =>
            `| ${skill.name} | ${skill.path || 'N/A'} | ${skill.installs.toLocaleString()} |`
        )
        .join('\n')}`
    : data.skillssh.status === 'not_found'
      ? `⏳ **Status:** No mapbox skills found on skills.sh\n\n_Mapbox agent skills will be tracked here once published to the skills.sh directory._`
      : data.skillssh.status === 'error'
        ? `⚠️ **Status:** Error fetching data\n\n_${data.skillssh.note}_`
        : `⏳ **Status:** Skills not yet published to skills.sh\n\n_Mapbox agent skills will be tracked here once published to the skills.sh directory._`
}

---

*Report generated automatically by \`scripts/generate-metrics-report.js\`*
`;
}

// Generate CSV report
function generateCsvReport(data) {
  const { timestamp, traffic } = data;

  let csv = 'Date,Total Views,Unique Views,Total Clones,Unique Clones\n';

  // Create a map of dates to combine views and clones
  const dateMap = new Map();

  traffic.views.daily.forEach((day) => {
    const date = new Date(day.timestamp).toISOString().split('T')[0];
    dateMap.set(date, {
      views: day.count,
      uniqueViews: day.uniques,
      clones: 0,
      uniqueClones: 0
    });
  });

  traffic.clones.daily.forEach((day) => {
    const date = new Date(day.timestamp).toISOString().split('T')[0];
    const existing = dateMap.get(date) || { views: 0, uniqueViews: 0 };
    dateMap.set(date, {
      ...existing,
      clones: day.count,
      uniqueClones: day.uniques
    });
  });

  // Sort by date and generate CSV rows
  Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([date, stats]) => {
      csv += `${date},${stats.views},${stats.uniqueViews},${stats.clones},${stats.uniqueClones}\n`;
    });

  return csv;
}

// Main execution
async function main() {
  const format = process.argv[2]?.replace('--format=', '') || 'markdown';

  console.log('🚀 Generating Mapbox Agent Skills Metrics Report...\n');

  // Fetch all metrics
  const githubMetrics = await fetchGitHubMetrics();
  const skillsshMetrics = await fetchSkillsShMetrics();

  const data = {
    ...githubMetrics,
    skillssh: skillsshMetrics
  };

  // Generate report in requested format
  let report;
  let filename;
  let extension;

  switch (format) {
    case 'json':
      report = JSON.stringify(data, null, 2);
      extension = 'json';
      break;
    case 'csv':
      report = generateCsvReport(data);
      extension = 'csv';
      break;
    case 'markdown':
    default:
      report = generateMarkdownReport(data);
      extension = 'md';
      break;
  }

  // Create timestamped filename
  const timestamp = new Date().toISOString().split('T')[0];
  filename = `${OUTPUT_DIR}/metrics-${timestamp}.${extension}`;

  // Also create a "latest" version
  const latestFilename = `${OUTPUT_DIR}/metrics-latest.${extension}`;

  // Write files
  try {
    // Create output directory if it doesn't exist
    execSync(`mkdir -p ${OUTPUT_DIR}`, { stdio: 'ignore' });

    writeFileSync(filename, report);
    writeFileSync(latestFilename, report);

    console.log(`\n✅ Report generated successfully!`);
    console.log(`   📄 ${filename}`);
    console.log(`   📄 ${latestFilename}`);
    console.log(
      `\n💡 Tip: Add to cron/GitHub Actions to track metrics over time`
    );
  } catch (error) {
    console.error('❌ Failed to write report:', error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
