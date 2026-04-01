#!/usr/bin/env node

/**
 * Eval runner for Mapbox Agent Skills
 *
 * Usage:
 *   npm run eval <skill-name>
 *   npm run eval mapbox-location-grounding
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

const GRADER_SYSTEM = `You are an eval grader. Given an AI response and a specific expectation,
determine whether the response satisfies the expectation.
Reply with exactly one word: PASS or FAIL, followed by a brief one-line reason.
Format: PASS: <reason> or FAIL: <reason>`;

async function runPrompt(client, systemPrompt, userPrompt) {
  const messages = [{ role: 'user', content: userPrompt }];
  const params = {
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages
  };
  if (systemPrompt) {
    params.system = systemPrompt;
  }
  const response = await client.messages.create(params);
  return response.content[0].type === 'text' ? response.content[0].text : '';
}

async function gradeExpectation(client, response, expectation) {
  const prompt = `AI Response:\n${response}\n\nExpectation:\n${expectation}\n\nDoes the response satisfy this expectation?`;
  const result = await runPrompt(client, GRADER_SYSTEM, prompt);
  const passed = result.trim().toUpperCase().startsWith('PASS');
  const reason = result.replace(/^(PASS|FAIL):\s*/i, '').trim();
  return { passed, reason };
}

async function runEval(client, skillContent, evalItem) {
  const [withoutResponse, withResponse] = await Promise.all([
    runPrompt(client, null, evalItem.prompt),
    runPrompt(client, skillContent, evalItem.prompt)
  ]);

  const [withoutGrades, withGrades] = await Promise.all([
    Promise.all(
      evalItem.expectations.map((e) =>
        gradeExpectation(client, withoutResponse, e)
      )
    ),
    Promise.all(
      evalItem.expectations.map((e) =>
        gradeExpectation(client, withResponse, e)
      )
    )
  ]);

  return { withoutResponse, withResponse, withoutGrades, withGrades };
}

function passRate(grades) {
  if (!grades.length) return 0;
  return (grades.filter((g) => g.passed).length / grades.length) * 100;
}

async function main() {
  const skillName = process.argv[2];
  if (!skillName) {
    console.error('Usage: npm run eval <skill-name>');
    console.error('Example: npm run eval mapbox-location-grounding');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const skillDir = join('skills', skillName);
  let skillContent, evalsData;

  try {
    skillContent = await readFile(join(skillDir, 'SKILL.md'), 'utf-8');
  } catch {
    console.error(`Error: Could not read ${join(skillDir, 'SKILL.md')}`);
    process.exit(1);
  }

  try {
    const raw = await readFile(join(skillDir, 'evals', 'evals.json'), 'utf-8');
    evalsData = JSON.parse(raw);
  } catch {
    console.error(
      `Error: Could not read ${join(skillDir, 'evals', 'evals.json')}`
    );
    process.exit(1);
  }

  const client = new Anthropic();
  const { evals } = evalsData;

  console.log(`\nRunning evals for: ${skillName}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Evals: ${evals.length}\n`);
  console.log('='.repeat(70));

  const allWithout = [];
  const allWith = [];

  for (const evalItem of evals) {
    console.log(
      `\nEval ${evalItem.id}: ${evalItem.prompt.slice(0, 80)}${evalItem.prompt.length > 80 ? '...' : ''}`
    );
    process.stdout.write('  Running... ');

    const { withoutGrades, withGrades } = await runEval(
      client,
      skillContent,
      evalItem
    );

    const withoutRate = passRate(withoutGrades);
    const withRate = passRate(withGrades);
    const delta = withRate - withoutRate;

    console.log(`done\n`);
    console.log(
      `  Without skill: ${withoutRate.toFixed(0)}%  |  With skill: ${withRate.toFixed(0)}%  |  Delta: ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}pp`
    );
    console.log(`  Expectations:`);

    for (let i = 0; i < evalItem.expectations.length; i++) {
      const exp = evalItem.expectations[i];
      const wo = withoutGrades[i];
      const w = withGrades[i];
      const woIcon = wo.passed ? '✅' : '❌';
      const wIcon = w.passed ? '✅' : '❌';
      console.log(`    ${woIcon}→${wIcon}  ${exp}`);
      if (!w.passed) {
        console.log(`         Reason: ${w.reason}`);
      }
    }

    allWithout.push(...withoutGrades);
    allWith.push(...withGrades);
  }

  const totalWithout = passRate(allWithout);
  const totalWith = passRate(allWith);
  const totalDelta = totalWith - totalWithout;

  console.log('\n' + '='.repeat(70));
  console.log('\nOverall Results:');
  console.log(`  Without skill (baseline): ${totalWithout.toFixed(1)}%`);
  console.log(`  With skill:               ${totalWith.toFixed(1)}%`);
  console.log(
    `  Delta:                    ${totalDelta >= 0 ? '+' : ''}${totalDelta.toFixed(1)}pp`
  );

  if (totalDelta >= 20) {
    console.log(`\n  ✅ Strong skill (+20pp target met)`);
  } else if (totalDelta >= 10) {
    console.log(
      `\n  ⚠️  Moderate improvement — consider tightening evals or skill content`
    );
  } else {
    console.log(
      `\n  ❌ Low delta — evals may be testing general knowledge, not skill-specific content`
    );
  }

  console.log('');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
