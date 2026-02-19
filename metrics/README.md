# Metrics Tracking

This directory contains tools and reports for tracking Mapbox Agent Skills adoption and usage metrics.

## Overview

The metrics system tracks:

- **GitHub Traffic** - Repository views, clones, referrers, and popular content
- **Repository Stats** - Stars, forks, watchers, issues
- **Skills.sh Data** - Download counts and usage (when published)

## Quick Start

### Generate Reports Locally

```bash
# Markdown report (default)
npm run metrics

# JSON format
npm run metrics:json

# CSV format
npm run metrics:csv
```

Reports are generated in the `metrics/` directory:

- `metrics-YYYY-MM-DD.md` - Timestamped report
- `metrics-latest.md` - Always the most recent report

## Automated Tracking

### GitHub Actions (Recommended)

The repository includes a workflow (`.github/workflows/metrics.yml`) that runs daily to generate metrics. The reports are available as workflow artifacts for 90 days.

**To download historical metrics:**

1. Go to [Actions](../../actions/workflows/metrics.yml)
2. Click on a workflow run
3. Download the `metrics-*` artifact

**To run manually:**

1. Go to [Actions](../../actions/workflows/metrics.yml)
2. Click "Run workflow"
3. Download artifacts after completion

### Local Cron Job

You can set up a local cron job to track metrics:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/mapbox-agent-skills && npm run metrics
```

## Report Formats

### Markdown (`.md`)

Human-readable report with formatted tables and charts. Great for sharing and reviewing.

### JSON (`.json`)

Machine-readable format with complete data. Use for:

- Building custom dashboards
- Long-term data storage
- Analysis and processing

### CSV (`.csv`)

Spreadsheet-compatible format with daily metrics. Use for:

- Excel/Google Sheets analysis
- Charting and visualization
- Trend analysis over time

## Tracking Over Time

Since metrics are not committed to the repository, you have several options for long-term tracking:

### Option 1: Download Workflow Artifacts

Download artifacts from GitHub Actions runs periodically and store locally or in a data repository.

### Option 2: Separate Data Repository

Create a dedicated repository for metrics data:

```bash
# Clone metrics repo
git clone git@github.com:mapbox/mapbox-agent-skills-metrics.git

# Generate and commit
cd mapbox-agent-skills
npm run metrics
mv metrics/*.* ../mapbox-agent-skills-metrics/
cd ../mapbox-agent-skills-metrics
git add .
git commit -m "📊 Update metrics"
git push
```

### Option 3: Cloud Storage

Upload reports to S3, GCS, or another cloud storage service:

```bash
# Example: Upload to S3
npm run metrics:json
aws s3 cp metrics/metrics-latest.json s3://bucket/metrics/$(date +%Y-%m-%d).json
```

### Option 4: Analytics Platform

Send metrics to an analytics platform (e.g., DataDog, CloudWatch, BigQuery) using the JSON output.

## Data Sources

### GitHub API

Metrics are fetched using the GitHub CLI (`gh`) which respects your authentication and rate limits.

**Available data:**

- Traffic views (last 14 days)
- Traffic clones (last 14 days)
- Referrers
- Popular paths
- Repository metadata

### Skills.sh

Once Mapbox skills are published to [skills.sh](https://skills.sh), download metrics will be included automatically.

**Status:** Not yet published (placeholder included in reports)

## Extending the System

The metrics script is located at `scripts/generate-metrics-report.js` and can be extended to:

- Add custom metrics sources
- Include additional GitHub data (issues, PRs, releases)
- Track skill-specific adoption metrics
- Generate custom visualizations

## Example Output

```markdown
# Mapbox Agent Skills - Metrics Report

**Generated:** February 18, 2026

## Repository Stats

- ⭐ **Stars:** 10
- 🍴 **Forks:** 0
- 👀 **Watchers:** 1

## Traffic (Last 14 Days)

- **Total Views:** 824
- **Unique Visitors:** 181
- **Total Clones:** 2,295
- **Unique Cloners:** 605

## Top Referrers

1. **Google** - 107 views (48 unique)
2. **github.com** - 63 views (28 unique)
...
```

## Troubleshooting

### "gh: command not found"

Install the GitHub CLI: <https://cli.github.com/>

### "Failed to fetch /repos/.../traffic/views"

Ensure you're authenticated: `gh auth login`

### No data in reports

GitHub traffic data is only available for the last 14 days. Run the script regularly to maintain historical data.

## Contributing

To improve the metrics system:

1. Edit `scripts/generate-metrics-report.js`
2. Test with `npm run metrics`
3. Submit a PR with your changes

---

For questions or issues, please [open an issue](../../issues).
