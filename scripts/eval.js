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

const MODEL = process.env.EVAL_MODEL || 'claude-sonnet-4-20250514';
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'claude-sonnet-4-20250514';
const CONCURRENCY = parseInt(process.env.EVAL_CONCURRENCY || '10', 10);
const SKILLS_DIR = 'skills';

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
 * Run a single eval: send prompt with skill context, then judge the response
 */
async function runEval(skillName, skillContent, evalItem) {
  // Step 1: Generate response using skill as system prompt
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: `You are an expert AI assistant with the following skill knowledge:\n\n${skillContent}`,
    messages: [{ role: 'user', content: evalItem.prompt }]
  });

  const assistantResponse = response.content
    .map((b) => b.text || '')
    .join('\n');

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
  // Build lookup: skill#id -> result
  const baseMap = new Map();
  for (const r of baseline.results) {
    baseMap.set(`${r.skillName}#${r.evalId}`, r);
  }
  const currMap = new Map();
  for (const r of current.results) {
    currMap.set(`${r.skillName}#${r.evalId}`, r);
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
  console.log(`Skills to evaluate: ${skillDirs.length}\n`);

  // Collect all eval tasks
  const tasks = [];
  for (const dir of skillDirs) {
    const skillPath = join(SKILLS_DIR, dir.name);
    const evalsFile = join(skillPath, 'evals', 'evals.json');

    if (!existsSync(evalsFile)) {
      console.log(`⏭  ${dir.name} — no evals.json, skipping`);
      continue;
    }

    const evalsData = JSON.parse(await readFile(evalsFile, 'utf-8'));
    const skillContent = await loadSkillContent(skillPath);

    for (const evalItem of evalsData.evals) {
      tasks.push({ skillName: dir.name, skillContent, evalItem });
    }
  }

  console.log(
    `Total evals: ${tasks.length}, running with concurrency ${CONCURRENCY}...\n`
  );

  // Run with concurrency pool
  const allResults = [];
  let completed = 0;

  async function runTask(task) {
    const { skillName, skillContent, evalItem } = task;
    try {
      const result = await runEval(skillName, skillContent, evalItem);
      completed++;
      const pct = (result.score * 100).toFixed(0);
      const icon =
        result.score >= 0.9 ? '✅' : result.score >= 0.6 ? '⚠️' : '❌';
      console.log(
        `[${completed}/${tasks.length}] ${icon} ${skillName} #${evalItem.id} — ${result.totalScore}/${result.maxScore} (${pct}%)`
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
        `[${completed}/${tasks.length}] ❌ ${skillName} #${evalItem.id} — Error: ${err.message}`
      );
      return {
        skillName,
        evalId: evalItem.id,
        prompt: evalItem.prompt.slice(0, 80) + '...',
        totalScore: 0,
        maxScore: evalItem.expectations.length * 3,
        score: 0,
        summary: `Error: ${err.message}`,
        expectationResults: [],
        modelResponse: ''
      };
    }
  }

  // Concurrency pool
  const executing = new Set();
  for (const task of tasks) {
    const p = runTask(task).then((result) => {
      allResults.push(result);
      executing.delete(p);
    });
    executing.add(p);
    if (executing.size >= CONCURRENCY) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);

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
  console.log(`Evals run:        ${allResults.length}`);
  console.log(
    `Total score:      ${totalScore}/${maxScore} (${((totalScore / maxScore) * 100).toFixed(1)}%)`
  );
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
      `  ${pct.padStart(3)}% ${bar} ${name} (${data.totalScore}/${data.maxScore})`
    );
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
        `\n${r.score < 0.6 ? '❌' : '⚠️'}  ${r.skillName} #${r.evalId} (${pct}%)`
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
      totalEvals: allResults.length,
      totalScore,
      maxScore,
      averageScore: avgScore,
      gradeDistribution: gradeCount
    },
    bySkill,
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
