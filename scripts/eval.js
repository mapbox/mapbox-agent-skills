#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { readFileSync } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

// Load .env file if present
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || '').replace(/^["']|["']$/g, '');
    }
  }
}

const anthropic = new Anthropic();

const MODEL = process.env.EVAL_MODEL || 'claude-sonnet-5';
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'claude-sonnet-5';
const CONCURRENCY = parseInt(process.env.EVAL_CONCURRENCY || '10', 10);
// Must leave room for extended thinking on top of the answer itself; at 4096 a
// thinking-heavy response can spend the entire budget before emitting any text.
const MAX_TOKENS = parseInt(process.env.EVAL_MAX_TOKENS || '8192', 10);
// Which content surface(s) to evaluate. 'skill' is SKILL.md + references/*.md;
// 'agents' is the hand-maintained AGENTS.md copy, which ships to users as a drop-in
// and can drift from it. Defaults to 'skill' so routine runs stay cheap and their
// totals stay comparable; use --surface=agents or --surface=both to check the copy.
const ALL_SURFACES = ['skill', 'agents'];
// How many times to run each eval. A single sample cannot distinguish a real
// change from generation/judge jitter, so any score comparison that drives a
// decision wants n > 1. Overridden by --repeats=N.
const REPEATS = parseInt(process.env.EVAL_REPEATS || '1', 10);
const SKILLS_DIR = 'skills';
// Eval definitions live outside skills/ on purpose: anything under skills/ is shipped
// to users by the plugin manifests, and that would hand an installed agent the answer
// key for the suite that grades it.
const EVALS_DIR = 'evals';

/**
 * Load a skill's full content: SKILL.md + all references/*.md
 */
async function loadSkillContent(skillPath) {
  const skillMd = await readFile(join(skillPath, 'SKILL.md'), 'utf-8');
  const refsDir = join(skillPath, 'references');
  let refsContent = '';

  if (existsSync(refsDir)) {
    const refFiles = (await readdir(refsDir)).filter((f) => f.endsWith('.md'));
    for (const file of refFiles) {
      const content = await readFile(join(refsDir, file), 'utf-8');
      refsContent += `\n\n--- ${file} ---\n${content}`;
    }
  }

  return skillMd + refsContent;
}

/**
 * Load a skill's AGENTS.md, the copy consumed by agents that read AGENTS.md
 * instead of SKILL.md. It is maintained by hand rather than generated, so it can
 * drift from SKILL.md + references — which is exactly what an eval should catch.
 * Returns null for skills that have no AGENTS.md.
 */
async function loadAgentsContent(skillPath) {
  const agentsMd = join(skillPath, 'AGENTS.md');
  if (!existsSync(agentsMd)) return null;
  return readFile(agentsMd, 'utf-8');
}

/**
 * Run a single eval: send prompt with skill context, then judge the response
 */
async function runEval(skillName, skillContent, evalItem, surface) {
  // Step 1: Generate response using skill as system prompt
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: `You are an expert AI assistant with the following skill knowledge:\n\n${skillContent}`,
    messages: [{ role: 'user', content: evalItem.prompt }]
  });

  const assistantResponse = response.content
    .map((b) => b.text || '')
    .join('\n');

  // A response that produced no text is an infrastructure failure, not a skill
  // failure. Extended thinking can consume the whole max_tokens budget, leaving
  // zero text blocks; judging that as a legitimate 0 hides the real cause.
  if (!assistantResponse.trim()) {
    throw new Error(
      `Empty response from ${MODEL} (stop_reason: ${response.stop_reason}, ` +
        `output_tokens: ${response.usage?.output_tokens}). ` +
        `Raise EVAL_MAX_TOKENS (currently ${MAX_TOKENS}) and re-run.`
    );
  }

  // Step 2: Judge the response against expectations
  const expectations = evalItem.expectations
    .map((e, i) => `${i + 1}. ${e}`)
    .join('\n');

  const judgePrompt = `You are an eval judge. Given a user prompt, an AI response, and a list of expectations, score how well each expectation is met.

Use this scale:
- 3 = FULL: Expectation is clearly and completely met with accurate details
- 2 = PARTIAL: Core idea is present but missing key details, has minor inaccuracies, or is vague
- 1 = MINIMAL: Tangentially related or only superficially touched on
- 0 = MISS: Not addressed at all, or fundamentally wrong

## User Prompt
${evalItem.prompt}

## AI Response
${assistantResponse}

## Expectations
${expectations}

Respond in this exact JSON format (no other text):
{
  "expectations": [
    {"index": 1, "score": 0-3, "label": "FULL|PARTIAL|MINIMAL|MISS", "reason": "..."},
    ...
  ],
  "totalScore": <sum>,
  "maxScore": ${evalItem.expectations.length * 3},
  "summary": "One sentence overall assessment"
}`;

  const judgeResponse = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: judgePrompt }]
  });

  const judgeText = judgeResponse.content.map((b) => b.text || '').join('\n');

  // Parse structured JSON from judge
  let judgeData;
  try {
    const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
    judgeData = JSON.parse(jsonMatch[0]);
  } catch {
    // Fallback if JSON parsing fails
    judgeData = {
      expectations: evalItem.expectations.map((_, i) => ({
        index: i + 1,
        score: 0,
        label: 'UNKNOWN',
        reason: 'Could not parse judge output'
      })),
      totalScore: 0,
      maxScore: evalItem.expectations.length * 3,
      summary: 'Judge output parsing failed'
    };
  }

  const expectationResults = evalItem.expectations.map((exp, i) => {
    const judge = judgeData.expectations.find((e) => e.index === i + 1) || {
      score: 0,
      label: 'UNKNOWN',
      reason: 'Missing from judge output'
    };
    return {
      index: i + 1,
      expectation: exp,
      score: judge.score,
      label: judge.label,
      reason: judge.reason
    };
  });

  const totalScore = expectationResults.reduce((s, e) => s + e.score, 0);
  const maxScore = evalItem.expectations.length * 3;

  return {
    skillName,
    surface,
    evalId: evalItem.id,
    prompt: evalItem.prompt,
    totalScore,
    maxScore,
    score: maxScore > 0 ? totalScore / maxScore : 0,
    summary: judgeData.summary || '',
    expectationResults,
    modelResponse: assistantResponse
  };
}

/**
 * Collapse repeated runs of one eval into a single result carrying the mean plus
 * a spread. `totalScore`/`score` stay the mean so all existing aggregation and
 * diffing keeps working; the per-run detail is retained for inspection.
 */
function aggregateRuns(allRunsForEval) {
  // A failed request is missing data, not evidence about the skill. Averaging a zero
  // into a repeat set would quietly drag the mean down and hide the cause.
  const runs = allRunsForEval.filter((r) => !r.error);
  const errored = allRunsForEval.filter((r) => r.error);

  if (runs.length === 0) {
    return { ...allRunsForEval[0], errorRuns: errored.length, repeats: 0 };
  }

  const base = runs[0];
  if (runs.length === 1) {
    return { ...base, repeats: 1, errorRuns: errored.length };
  }

  const scores = runs.map((r) => r.score);
  const n = scores.length;
  const mean = scores.reduce((a, b) => a + b, 0) / n;
  const variance =
    scores.reduce((acc, x) => acc + (x - mean) ** 2, 0) / (n - 1);
  const stddev = Math.sqrt(variance);
  // Normal-approximation 95% interval on the mean. Rough at small n, but enough
  // to tell "this moved" from "this is noise".
  const ci95 = 1.96 * (stddev / Math.sqrt(n));

  // Report the detail of the run closest to the mean, so a drill-down is
  // representative rather than a lucky or unlucky extreme.
  const representative = runs.reduce((best, r) =>
    Math.abs(r.score - mean) < Math.abs(best.score - mean) ? r : best
  );

  return {
    ...representative,
    totalScore: mean * base.maxScore,
    score: mean,
    repeats: n,
    scoreMin: Math.min(...scores),
    scoreMax: Math.max(...scores),
    scoreStddev: stddev,
    scoreCI95: ci95,
    runScores: scores,
    errorRuns: errored.length
  };
}

/** Render a score that may be fractional once averaged across repeats. */
function fmtScore(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function scoreBar(ratio, width) {
  const filled = Math.round(ratio * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function delta(val) {
  if (val > 0) return `+${val}`;
  if (val < 0) return `${val}`;
  return '=';
}

function deltaColor(val) {
  if (val > 0) return `↑${val}`;
  if (val < 0) return `↓${Math.abs(val)}`;
  return '—';
}

const RESULTS_DIR = 'evals';

const BASELINE_PATH = join(RESULTS_DIR, 'baseline.json');

async function findBaseline(diffArg) {
  // --diff=<file> uses that specific file
  if (diffArg && diffArg !== true) {
    const p = diffArg.startsWith('/') ? diffArg : join(RESULTS_DIR, diffArg);
    if (existsSync(p)) return JSON.parse(await readFile(p, 'utf-8'));
    return null;
  }
  // --diff uses baseline.json
  if (existsSync(BASELINE_PATH)) {
    return JSON.parse(await readFile(BASELINE_PATH, 'utf-8'));
  }
  return null;
}

function buildDiffReport(baseline, current) {
  // Build lookup: skill#id@surface -> result. Results written before surfaces
  // existed have no surface field and describe SKILL.md + references.
  const keyOf = (r) => `${r.skillName}#${r.evalId}@${r.surface || 'skill'}`;
  const baseMap = new Map();
  for (const r of baseline.results) {
    baseMap.set(keyOf(r), r);
  }
  const currMap = new Map();
  for (const r of current.results) {
    currMap.set(keyOf(r), r);
  }

  const allKeys = new Set([...baseMap.keys(), ...currMap.keys()]);
  const diffs = [];

  for (const key of [...allKeys].sort()) {
    const base = baseMap.get(key);
    const curr = currMap.get(key);

    if (!base) {
      diffs.push({ key, type: 'new', curr });
      continue;
    }
    if (!curr) {
      diffs.push({ key, type: 'removed', base });
      continue;
    }

    const scoreDelta = curr.totalScore - base.totalScore;
    const expDiffs = [];

    // Compare each expectation by index
    const maxLen = Math.max(
      curr.expectationResults?.length || 0,
      base.expectationResults?.length || 0
    );
    for (let i = 0; i < maxLen; i++) {
      const be = base.expectationResults?.[i];
      const ce = curr.expectationResults?.[i];
      if (!be && ce) {
        expDiffs.push({ index: i + 1, type: 'new', curr: ce });
      } else if (be && !ce) {
        expDiffs.push({ index: i + 1, type: 'removed', base: be });
      } else if (be && ce && be.score !== ce.score) {
        expDiffs.push({
          index: i + 1,
          type: 'changed',
          base: be,
          curr: ce,
          delta: ce.score - be.score
        });
      }
    }

    if (scoreDelta !== 0 || expDiffs.length > 0) {
      diffs.push({ key, type: 'changed', base, curr, scoreDelta, expDiffs });
    }
  }

  return diffs;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const filterSkill = args.find((a) => !a.startsWith('--'));
  const verbose = args.includes('--verbose') || args.includes('-v');
  const diffArg = args.find((a) => a.startsWith('--diff'));
  const diffVal = diffArg
    ? diffArg.includes('=')
      ? diffArg.split('=')[1]
      : true
    : false;
  const updateBaseline = args.includes('--update-baseline');
  const repeatsArg = args.find((a) => a.startsWith('--repeats'));
  const repeats = repeatsArg?.includes('=')
    ? parseInt(repeatsArg.split('=')[1], 10)
    : REPEATS;
  if (!Number.isInteger(repeats) || repeats < 1) {
    console.error(`Invalid --repeats. Expected a positive integer.`);
    process.exit(1);
  }
  const surfaceArg = args.find((a) => a.startsWith('--surface'));
  const surfaceVal = surfaceArg?.includes('=')
    ? surfaceArg.split('=')[1]
    : 'skill';
  if (!['skill', 'agents', 'both'].includes(surfaceVal)) {
    console.error(
      `Invalid --surface=${surfaceVal}. Expected skill, agents, or both.`
    );
    process.exit(1);
  }
  const surfaces = surfaceVal === 'both' ? ALL_SURFACES : [surfaceVal];

  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skillDirs = entries
    .filter((e) => e.isDirectory())
    .filter((e) => !filterSkill || e.name === filterSkill);

  if (skillDirs.length === 0) {
    console.error(
      filterSkill
        ? `No skill found: ${filterSkill}`
        : 'No skill directories found'
    );
    process.exit(1);
  }

  // Load baseline BEFORE running evals (so we don't compare against ourselves)
  const baseline = diffVal ? await findBaseline(diffVal) : null;
  if (diffVal && !baseline) {
    console.log(
      'No baseline found for --diff. Run eval once first, then modify, then run with --diff.\n'
    );
  } else if (baseline) {
    console.log(
      `Baseline: ${baseline.meta.timestamp.slice(0, 19)} (${baseline.meta.model})\n`
    );
  }

  console.log(`Eval model: ${MODEL}`);
  console.log(`Judge model: ${JUDGE_MODEL}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Surfaces: ${surfaces.join(', ')}`);
  console.log(`Repeats per eval: ${repeats}`);
  console.log(`Skills to evaluate: ${skillDirs.length}\n`);

  // Collect all eval tasks
  const tasks = [];
  for (const dir of skillDirs) {
    const skillPath = join(SKILLS_DIR, dir.name);
    const evalsFile = join(EVALS_DIR, dir.name, 'evals.json');

    if (!existsSync(evalsFile)) {
      console.log(`⏭  ${dir.name} — no evals.json, skipping`);
      continue;
    }

    const evalsData = JSON.parse(await readFile(evalsFile, 'utf-8'));
    const content = {
      skill: await loadSkillContent(skillPath),
      agents: await loadAgentsContent(skillPath)
    };

    for (const surface of surfaces) {
      if (!content[surface]) {
        console.log(`⏭  ${dir.name} — no AGENTS.md, skipping agents surface`);
        continue;
      }
      for (const evalItem of evalsData.evals) {
        for (let run = 1; run <= repeats; run++) {
          tasks.push({
            skillName: dir.name,
            skillContent: content[surface],
            evalItem,
            surface,
            run
          });
        }
      }
    }
  }

  console.log(
    `Total runs: ${tasks.length}${repeats > 1 ? ` (${tasks.length / repeats} evals x ${repeats})` : ''}, ` +
      `concurrency ${CONCURRENCY}...\n`
  );

  // Run with concurrency pool
  const allRuns = [];
  let completed = 0;

  async function runTask(task) {
    const { skillName, skillContent, evalItem, surface, run } = task;
    const runLabel = repeats > 1 ? ` run ${run}/${repeats}` : '';
    try {
      const result = await runEval(skillName, skillContent, evalItem, surface);
      completed++;
      const pct = (result.score * 100).toFixed(0);
      const icon =
        result.score >= 0.9 ? '✅' : result.score >= 0.6 ? '⚠️' : '❌';
      console.log(
        `[${completed}/${tasks.length}] ${icon} ${skillName} #${evalItem.id} [${surface}]${runLabel} — ${result.totalScore}/${result.maxScore} (${pct}%)`
      );
      if (verbose) {
        for (const e of result.expectationResults) {
          const eIcon =
            e.score === 3
              ? '█'
              : e.score === 2
                ? '▓'
                : e.score === 1
                  ? '░'
                  : '·';
          console.log(
            `   ${eIcon} [${e.score}/3 ${e.label}] ${e.expectation.slice(0, 80)}`
          );
          console.log(`     → ${e.reason}`);
        }
        console.log();
      }
      return result;
    } catch (err) {
      completed++;
      console.log(
        `[${completed}/${tasks.length}] ❌ ${skillName} #${evalItem.id} [${surface}]${runLabel} — Error: ${err.message}`
      );
      return {
        skillName,
        surface,
        evalId: evalItem.id,
        prompt: evalItem.prompt.slice(0, 80) + '...',
        error: err.message,
        summary: `Error: ${err.message}`,
        expectationResults: []
      };
    }
  }

  // Concurrency pool
  const executing = new Set();
  for (const task of tasks) {
    const p = runTask(task).then((result) => {
      allRuns.push(result);
      executing.delete(p);
    });
    executing.add(p);
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);

  // Collapse repeats of the same eval into one result carrying mean + spread
  const grouped = new Map();
  for (const r of allRuns) {
    const key = `${r.skillName}#${r.evalId}@${r.surface || 'skill'}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }
  const aggregated = [...grouped.values()].map(aggregateRuns);
  const allResults = aggregated.filter((r) => r.repeats > 0);
  const failedEvals = aggregated.filter((r) => r.repeats === 0);

  console.log();

  // Summary
  const totalScore = allResults.reduce((s, r) => s + r.totalScore, 0);
  const maxScore = allResults.reduce((s, r) => s + r.maxScore, 0);
  const avgScore =
    allResults.length > 0
      ? allResults.reduce((s, r) => s + r.score, 0) / allResults.length
      : 0;

  // Count by grade
  const allExps = allResults.flatMap((r) => r.expectationResults);
  const gradeCount = { FULL: 0, PARTIAL: 0, MINIMAL: 0, MISS: 0, UNKNOWN: 0 };
  for (const e of allExps) {
    gradeCount[e.label] = (gradeCount[e.label] || 0) + 1;
  }

  console.log('═'.repeat(50));
  console.log('EVAL SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Evals scored:     ${allResults.length}`);
  if (failedEvals.length > 0) {
    console.log(
      `Evals failed:     ${failedEvals.length} (excluded from all scores below)`
    );
  }
  console.log(
    maxScore > 0
      ? `Total score:      ${fmtScore(totalScore)}/${maxScore} (${((totalScore / maxScore) * 100).toFixed(1)}%)`
      : 'Total score:      n/a — no eval produced a usable response'
  );

  // With repeats, put an interval on the suite mean so a run-to-run delta can be
  // read as signal or noise instead of being taken at face value.
  if (repeats > 1) {
    const perEval = allResults.map((r) => r.score);
    const n = perEval.length;
    const mean = perEval.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(
      perEval.reduce((acc, x) => acc + (x - mean) ** 2, 0) / Math.max(n - 1, 1)
    );
    const ci = 1.96 * (sd / Math.sqrt(n));
    console.log(
      `Suite mean:       ${(mean * 100).toFixed(1)}% ± ${(ci * 100).toFixed(1)} (95% CI, n=${repeats} per eval)`
    );
  }
  console.log(
    `Grade breakdown:  █ FULL=${gradeCount.FULL}  ▓ PARTIAL=${gradeCount.PARTIAL}  ░ MINIMAL=${gradeCount.MINIMAL}  · MISS=${gradeCount.MISS}`
  );

  // Per-skill breakdown
  const bySkill = {};
  for (const r of allResults) {
    if (!bySkill[r.skillName])
      bySkill[r.skillName] = { totalScore: 0, maxScore: 0, count: 0 };
    bySkill[r.skillName].totalScore += r.totalScore;
    bySkill[r.skillName].maxScore += r.maxScore;
    bySkill[r.skillName].count++;
  }

  console.log('\nPer-skill breakdown:');
  for (const [name, data] of Object.entries(bySkill).sort(
    (a, b) => a[1].totalScore / a[1].maxScore - b[1].totalScore / b[1].maxScore
  )) {
    const pct = ((data.totalScore / data.maxScore) * 100).toFixed(0);
    const bar = scoreBar(data.totalScore / data.maxScore, 20);
    console.log(
      `  ${pct.padStart(3)}% ${bar} ${name} (${fmtScore(data.totalScore)}/${data.maxScore})`
    );
  }

  // Per-surface breakdown: does AGENTS.md hold up as well as SKILL.md?
  const bySurface = {};
  for (const r of allResults) {
    const key = r.surface || 'skill';
    if (!bySurface[key])
      bySurface[key] = { totalScore: 0, maxScore: 0, count: 0 };
    bySurface[key].totalScore += r.totalScore;
    bySurface[key].maxScore += r.maxScore;
    bySurface[key].count++;
  }

  if (Object.keys(bySurface).length > 1) {
    console.log('\nPer-surface breakdown:');
    for (const name of ALL_SURFACES) {
      const data = bySurface[name];
      if (!data) continue;
      const label = name === 'skill' ? 'SKILL.md + refs' : 'AGENTS.md';
      const pct = ((data.totalScore / data.maxScore) * 100).toFixed(0);
      const bar = scoreBar(data.totalScore / data.maxScore, 20);
      console.log(
        `  ${pct.padStart(3)}% ${bar} ${label.padEnd(16)} (${fmtScore(data.totalScore)}/${data.maxScore}, ${data.count} evals)`
      );
    }
  }

  if (failedEvals.length > 0) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log('ERRORS (not scored)');
    console.log('═'.repeat(50));
    for (const r of failedEvals) {
      console.log(
        `  ${r.skillName} #${r.evalId} [${r.surface || 'skill'}] — ${r.error}`
      );
    }
    console.log(
      '\nThese produced no usable response. Fix the cause and re-run; they are not\n' +
        'counted as skill failures.'
    );
  }

  // Unstable evals: a wide spread across identical runs means this eval cannot
  // support a decision, whatever its mean happens to be.
  if (repeats > 1) {
    const unstable = allResults
      .filter((r) => (r.scoreStddev || 0) > 0.05)
      .sort((a, b) => b.scoreStddev - a.scoreStddev);

    console.log(`\n${'═'.repeat(50)}`);
    console.log('VARIANCE');
    console.log('═'.repeat(50));

    if (unstable.length === 0) {
      console.log('All evals stable across repeats (stddev <= 0.05).');
    } else {
      console.log(
        `${unstable.length} of ${allResults.length} evals vary across identical runs:\n`
      );
      for (const r of unstable) {
        console.log(
          `  ${r.skillName} #${r.evalId} [${r.surface || 'skill'}] — ` +
            `mean ${(r.score * 100).toFixed(0)}% ± ${(r.scoreCI95 * 100).toFixed(0)}, ` +
            `range ${(r.scoreMin * 100).toFixed(0)}–${(r.scoreMax * 100).toFixed(0)}% ` +
            `(runs: ${r.runScores.map((x) => (x * 100).toFixed(0) + '%').join(', ')})`
        );
      }
      console.log(
        "\nA change smaller than an eval's range cannot be attributed to the change."
      );
    }
  }

  // Non-perfect expectations detail (sorted worst first)
  const imperfect = allResults
    .filter((r) => r.score < 1)
    .sort((a, b) => a.score - b.score);

  if (imperfect.length > 0) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log('NEEDS IMPROVEMENT');
    console.log('═'.repeat(50));
    for (const r of imperfect) {
      const weakExps = r.expectationResults.filter((e) => e.score < 3);
      const pct = (r.score * 100).toFixed(0);
      console.log(
        `\n${r.score < 0.6 ? '❌' : '⚠️'}  ${r.skillName} #${r.evalId} [${r.surface || 'skill'}] (${pct}%)`
      );
      console.log(`   ${r.summary}`);
      console.log(`   Prompt: ${r.prompt.slice(0, 120)}...`);
      for (const exp of weakExps) {
        const icon = exp.score === 2 ? '▓' : exp.score === 1 ? '░' : '·';
        console.log(
          `   ${icon} [${exp.score}/3 ${exp.label}] ${exp.expectation.slice(0, 100)}`
        );
        console.log(`     → ${exp.reason}`);
      }
    }
  }

  // Always save results to evals/ directory
  const output = {
    meta: {
      timestamp: new Date().toISOString(),
      model: MODEL,
      judgeModel: JUDGE_MODEL,
      repeats,
      totalEvals: allResults.length,
      failedEvals: failedEvals.length,
      totalScore,
      maxScore,
      averageScore: avgScore,
      gradeDistribution: gradeCount
    },
    bySkill,
    bySurface,
    failures: failedEvals.map((r) => ({
      skillName: r.skillName,
      surface: r.surface || 'skill',
      evalId: r.evalId,
      error: r.error
    })),
    results: allResults.sort((a, b) => a.score - b.score)
  };

  if (!existsSync(RESULTS_DIR)) await mkdir(RESULTS_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(RESULTS_DIR, `eval-${timestamp}.json`);
  await writeFile(outPath, JSON.stringify(output, null, 2));
  await writeFile(
    join(RESULTS_DIR, 'latest.json'),
    JSON.stringify(output, null, 2)
  );
  console.log(`\nResults saved to ${outPath}`);

  if (updateBaseline) {
    await writeFile(BASELINE_PATH, JSON.stringify(output, null, 2));
    console.log(`Baseline updated: ${BASELINE_PATH}`);
  } else if (!existsSync(BASELINE_PATH)) {
    // First run ever — auto-create baseline
    await writeFile(BASELINE_PATH, JSON.stringify(output, null, 2));
    console.log(`Baseline created: ${BASELINE_PATH} (first run)`);
  }

  // Diff against baseline
  if (diffVal && baseline) {
    {
      const diffs = buildDiffReport(baseline, output);

      console.log(`\n${'═'.repeat(50)}`);
      console.log(`DIFF vs ${baseline.meta.timestamp.slice(0, 19)}`);
      console.log(`Model: ${baseline.meta.model} → ${MODEL}`);
      console.log('═'.repeat(50));

      const baseTotal = baseline.meta.totalScore;
      const currTotal = totalScore;
      const overallDelta = currTotal - baseTotal;
      const basePct = ((baseTotal / baseline.meta.maxScore) * 100).toFixed(1);
      const currPct = ((currTotal / maxScore) * 100).toFixed(1);
      console.log(
        `Overall: ${basePct}% → ${currPct}% (${delta(overallDelta)} points)`
      );

      // Per-skill diff
      const skillNames = new Set([
        ...Object.keys(baseline.bySkill || {}),
        ...Object.keys(bySkill)
      ]);
      const skillChanges = [];
      for (const name of skillNames) {
        const b = baseline.bySkill?.[name];
        const c = bySkill[name];
        const bPct = b ? ((b.totalScore / b.maxScore) * 100).toFixed(0) : '—';
        const cPct = c ? ((c.totalScore / c.maxScore) * 100).toFixed(0) : '—';
        const d = (c?.totalScore || 0) - (b?.totalScore || 0);
        if (d !== 0 || !b || !c) {
          skillChanges.push({ name, bPct, cPct, d });
        }
      }

      if (skillChanges.length > 0) {
        console.log('\nSkill changes:');
        for (const s of skillChanges.sort((a, b) => a.d - b.d)) {
          const arrow = s.d > 0 ? '📈' : s.d < 0 ? '📉' : '🆕';
          console.log(
            `  ${arrow} ${s.name}: ${s.bPct}% → ${s.cPct}% (${delta(s.d)})`
          );
        }
      }

      // Expectation-level diffs
      if (diffs.length > 0) {
        console.log('\nExpectation changes:');
        for (const d of diffs) {
          if (d.type === 'new') {
            console.log(
              `  🆕 ${d.key} — new eval (${d.curr.totalScore}/${d.curr.maxScore})`
            );
          } else if (d.type === 'removed') {
            console.log(`  🗑️  ${d.key} — removed`);
          } else if (d.type === 'changed' && d.expDiffs) {
            for (const ed of d.expDiffs) {
              if (ed.type === 'changed') {
                const icon = ed.delta > 0 ? '📈' : '📉';
                console.log(
                  `  ${icon} ${d.key} exp#${ed.index}: ${ed.base.label}(${ed.base.score}) → ${ed.curr.label}(${ed.curr.score}) [${delta(ed.delta)}]`
                );
                console.log(`     ${ed.curr.expectation.slice(0, 90)}`);
                if (ed.delta < 0) {
                  console.log(`     was: ${ed.base.reason}`);
                  console.log(`     now: ${ed.curr.reason}`);
                }
              }
            }
          }
        }
      } else {
        console.log('\nNo expectation-level changes detected.');
      }
    }
  }

  // Exit code based on overall pass rate
  if (avgScore < 0.5) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
