#!/usr/bin/env node

// Runs a migration skill end to end against a fixture app and scores the result.
// See fixtures/README.md.

import Anthropic from '@anthropic-ai/sdk';
import { spawnSync } from 'child_process';
import {
  cpSync,
  existsSync,
  globSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'fs';
import { homedir, tmpdir } from 'os';
import { join, resolve } from 'path';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || '').replace(/^["']|["']$/g, '');
    }
  }
}

const ROOT = resolve('.');
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'claude-sonnet-5';
const AGENT_TIMEOUT_MS = parseInt(
  process.env.EVAL_AGENT_TIMEOUT_MS || String(60 * 60 * 1000),
  10
);
const BUILD_TIMEOUT_MS = 20 * 60 * 1000;
const SKIP_DIRS = ['build', '.gradle', '.git', '.claude', '.agents', '.codex'];

function parseArgs(argv) {
  const args = { agent: 'claude', runs: 1, keep: false, hint: true };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--agent') args.agent = argv[++i];
    else if (a === '--runs') args.runs = parseInt(argv[++i], 10);
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--keep') args.keep = true;
    else if (a === '--no-hint') args.hint = false;
    else rest.push(a);
  }
  args.fixture = rest[0];
  return args;
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, {
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024,
    ...opts
  });
  return {
    status: res.status,
    stdout: res.stdout || '',
    stderr: res.stderr || '',
    error: res.error ? String(res.error) : undefined
  };
}

function androidSdkDir() {
  if (process.env.ANDROID_HOME) return process.env.ANDROID_HOME;
  const mac = join(homedir(), 'Library', 'Android', 'sdk');
  return existsSync(mac) ? mac : undefined;
}

/** Copy the fixture into a fresh git repo with the skill installed. */
function prepareWorkspace(fixtureDir, fixture) {
  const ws = mkdtempSync(join(tmpdir(), `fixture-${fixture.name}-`));
  cpSync(fixtureDir, ws, {
    recursive: true,
    filter: (src) =>
      !SKIP_DIRS.some((d) => src.includes(`/${d}/`) || src.endsWith(`/${d}`)) &&
      !src.endsWith('local.properties')
  });
  rmSync(join(ws, 'fixture.json'));

  const sdk = androidSdkDir();
  if (existsSync(join(ws, 'gradlew')) && sdk) {
    writeFileSync(join(ws, 'local.properties'), `sdk.dir=${sdk}\n`);
  }

  const skillSrc = join(ROOT, 'skills', fixture.skill);
  for (const dir of ['.claude/skills', '.agents/skills']) {
    cpSync(skillSrc, join(ws, dir, fixture.skill), {
      recursive: true,
      filter: (src) => !src.includes('/evals')
    });
  }

  writeFileSync(
    join(ws, '.gitignore'),
    '.gradle/\nbuild/\nlocal.properties\n.claude/\n.agents/\n'
  );
  run('git', ['init', '-q'], { cwd: ws });
  run('git', ['add', '-A'], { cwd: ws });
  run(
    'git',
    [
      '-c',
      'user.name=fixture',
      '-c',
      'user.email=fixture@example.com',
      'commit',
      '-qm',
      'fixture'
    ],
    { cwd: ws }
  );
  return ws;
}

function buildPrompt(fixture, hint) {
  if (!hint) return fixture.prompt;
  return `Use the ${fixture.skill} skill (.agents/skills/${fixture.skill}/SKILL.md). ${fixture.prompt}`;
}

function runAgent(agent, ws, prompt, model) {
  const started = Date.now();
  let res;
  if (agent === 'claude') {
    const args = [
      '-p',
      prompt,
      '--output-format',
      'json',
      '--dangerously-skip-permissions',
      '--setting-sources',
      'project',
      '--strict-mcp-config',
      '--no-session-persistence'
    ];
    if (model) args.push('--model', model);
    res = run('claude', args, { cwd: ws, timeout: AGENT_TIMEOUT_MS });
  } else if (agent === 'codex') {
    // The workspace is a throwaway copy; Gradle needs network and ~/.gradle,
    // which the workspace-write sandbox blocks.
    const args = [
      'exec',
      '--dangerously-bypass-approvals-and-sandbox',
      '-C',
      ws,
      prompt
    ];
    if (model) args.splice(1, 0, '-m', model);
    res = run('codex', args, { cwd: ws, timeout: AGENT_TIMEOUT_MS });
  } else if (agent === 'none') {
    // Baseline: score the untouched fixture to confirm the checks catch it.
    res = { status: 0, stdout: '', stderr: '' };
  } else {
    throw new Error(`Unknown agent "${agent}" (use claude, codex or none)`);
  }

  const out = {
    exitCode: res.status,
    durationMs: Date.now() - started,
    error: res.error
  };
  if (agent === 'claude') {
    try {
      const json = JSON.parse(res.stdout);
      out.numTurns = json.num_turns;
      out.costUsd = json.total_cost_usd;
      out.isError = json.is_error;
      out.finalMessage = json.result;
    } catch {
      out.finalMessage = res.stdout.slice(-4000);
    }
  } else {
    out.finalMessage = res.stdout.slice(-4000);
  }
  if (res.stderr) out.stderr = res.stderr.slice(-4000);
  return out;
}

function sourceFiles(ws, globs) {
  const files = new Set();
  for (const g of globs) {
    for (const f of globSync(g, { cwd: ws })) {
      if (!SKIP_DIRS.some((d) => f.split('/').includes(d))) files.add(f);
    }
  }
  return [...files].sort();
}

function patternHits(ws, files, pattern) {
  const re = new RegExp(pattern);
  const hits = [];
  for (const f of files) {
    readFileSync(join(ws, f), 'utf-8')
      .split('\n')
      .forEach((line, i) => {
        if (re.test(line)) hits.push(`${f}:${i + 1}`);
      });
  }
  return hits;
}

function runChecks(ws, fixture) {
  const files = sourceFiles(ws, fixture.sourceGlobs);
  const c = fixture.checks;
  const result = (list, passIf) =>
    (list || []).map(({ pattern, why }) => {
      const hits = patternHits(ws, files, pattern);
      return { pattern, why, hits, pass: passIf(hits) };
    });
  return {
    required: result(c.required, (h) => h.length > 0),
    forbidden: result(c.forbidden, (h) => h.length === 0),
    discouraged: result(c.discouraged, (h) => h.length === 0),
    preserve: result(c.preserve, (h) => h.length > 0)
  };
}

function runBuild(ws, fixture) {
  const started = Date.now();
  const res = run('sh', ['-c', fixture.build], {
    cwd: ws,
    timeout: BUILD_TIMEOUT_MS
  });
  return {
    pass: res.status === 0,
    durationMs: Date.now() - started,
    output: res.status === 0 ? '' : (res.stdout + res.stderr).slice(-6000)
  };
}

async function judgeReport(fixture, report, diffStat) {
  const expectations = fixture.reportExpectations
    .map((e, i) => `${i + 1}. ${e}`)
    .join('\n');
  const maxScore = fixture.reportExpectations.length * 3;
  if (!report) {
    return {
      totalScore: 0,
      maxScore,
      score: 0,
      summary: `No ${fixture.reportFile} was written`,
      expectations: []
    };
  }

  const prompt = `You are an eval judge. A coding agent migrated an app and wrote the migration report below. Score how well the report meets each expectation.

Use this scale:
- 3 = FULL: clearly and completely met with accurate details
- 2 = PARTIAL: core idea present but missing key details or vague
- 1 = MINIMAL: only superficially touched on
- 0 = MISS: not addressed, or wrong

## Files changed (git diff --stat)
${diffStat}

## Migration report
${report}

## Expectations
${expectations}

Respond in this exact JSON format (no other text):
{
  "expectations": [
    {"index": 1, "score": 0-3, "label": "FULL|PARTIAL|MINIMAL|MISS", "reason": "..."}
  ],
  "summary": "One sentence overall assessment"
}`;

  const anthropic = new Anthropic();
  const res = await anthropic.messages.create({
    model: JUDGE_MODEL,
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });
  const text = res.content.map((b) => b.text || '').join('\n');
  let data;
  try {
    data = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    data = { expectations: [], summary: 'Judge output parsing failed' };
  }
  const scored = fixture.reportExpectations.map((exp, i) => {
    const j = data.expectations.find((e) => e.index === i + 1) || {
      score: 0,
      label: 'UNKNOWN',
      reason: 'Missing from judge output'
    };
    return {
      expectation: exp,
      score: j.score,
      label: j.label,
      reason: j.reason
    };
  });
  const totalScore = scored.reduce((s, e) => s + e.score, 0);
  return {
    totalScore,
    maxScore,
    score: totalScore / maxScore,
    summary: data.summary,
    expectations: scored
  };
}

function printRun(i, r) {
  const mark = (ok) => (ok ? '✅' : '❌');
  console.log(
    `\nRun ${i + 1}  (${Math.round(r.agent.durationMs / 60000)} min, ${r.agent.numTurns ?? '?'} turns${r.agent.costUsd ? `, $${r.agent.costUsd.toFixed(2)}` : ''})`
  );
  console.log(`  ${mark(r.build.pass)} Build`);
  for (const [kind, list] of Object.entries(r.checks)) {
    for (const c of list) {
      const icon = c.pass ? '✅' : kind === 'discouraged' ? '⚠️ ' : '❌';
      const where =
        c.hits.length && !c.pass ? `  (${c.hits.slice(0, 3).join(', ')})` : '';
      console.log(`  ${icon} ${kind}: ${c.why}${where}`);
    }
  }
  console.log(
    `  📝 Report: ${r.report.totalScore}/${r.report.maxScore}  ${r.report.summary || ''}`
  );
  for (const e of r.report.expectations) {
    if (e.score < 3)
      console.log(
        `     ${e.label} (${e.score}): ${e.expectation}\n       ${e.reason}`
      );
  }
  console.log(`  ${r.passed ? '✅ PASSED' : '❌ FAILED'}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.fixture) {
    console.error(
      'Usage: npm run eval:fixture <fixture> [-- --agent claude|codex --runs N --model M --keep --no-hint]'
    );
    process.exit(1);
  }
  const fixtureDir = join(ROOT, 'fixtures', args.fixture);
  const fixture = JSON.parse(
    readFileSync(join(fixtureDir, 'fixture.json'), 'utf-8')
  );
  const resultsDir = join(ROOT, 'fixtures', 'results');
  mkdirSync(resultsDir, { recursive: true });

  console.log(
    `Fixture ${fixture.name}, skill ${fixture.skill}, agent ${args.agent}, ${args.runs} run(s)`
  );
  const runs = [];
  for (let i = 0; i < args.runs; i++) {
    const ws = prepareWorkspace(fixtureDir, fixture);
    console.log(`\nRun ${i + 1}: workspace ${ws}`);
    const agent = runAgent(
      args.agent,
      ws,
      buildPrompt(fixture, args.hint),
      args.model
    );
    const build = runBuild(ws, fixture);
    const checks = runChecks(ws, fixture);
    const reportPath = join(ws, fixture.reportFile);
    const report = existsSync(reportPath)
      ? readFileSync(reportPath, 'utf-8')
      : null;
    run('git', ['add', '-A'], { cwd: ws });
    const diffStat = run('git', ['diff', '--cached', '--stat'], {
      cwd: ws
    }).stdout;
    const diff = run('git', ['diff', '--cached'], { cwd: ws }).stdout;
    const judged = await judgeReport(fixture, report, diffStat);

    const passed =
      build.pass &&
      [...checks.required, ...checks.forbidden, ...checks.preserve].every(
        (c) => c.pass
      );
    const r = {
      run: i + 1,
      workspace: args.keep ? ws : undefined,
      agent,
      build,
      checks,
      report: judged,
      passed,
      reportText: report,
      diff
    };
    printRun(i, r);
    runs.push(r);
    if (!args.keep) rmSync(ws, { recursive: true, force: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(resultsDir, `${fixture.name}-${args.agent}-${stamp}.json`);
  writeFileSync(
    out,
    JSON.stringify(
      {
        fixture: fixture.name,
        skill: fixture.skill,
        agent: args.agent,
        model: args.model,
        hint: args.hint,
        judgeModel: JUDGE_MODEL,
        timestamp: new Date().toISOString(),
        runs
      },
      null,
      2
    )
  );
  const passCount = runs.filter((r) => r.passed).length;
  const avgReport = runs.reduce((s, r) => s + r.report.score, 0) / runs.length;
  console.log(
    `\n${passCount}/${runs.length} runs passed, average report score ${(avgReport * 100).toFixed(0)}%`
  );
  console.log(`Results: ${out}`);
  process.exit(passCount === runs.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
