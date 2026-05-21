# Contributing to Mapbox Agent Skills

Thank you for your interest in contributing to Mapbox Agent Skills! This repository helps AI assistants build better Mapbox applications through structured domain expertise.

## Types of Contributions

We welcome:

- **New skills** - Add expertise in areas not yet covered
- **Skill improvements** - Enhance existing skills with better examples, patterns, or guidance
- **Bug fixes** - Correct errors in instructions or examples
- **Documentation** - Improve clarity, add use cases, or expand examples

## Before You Start

1. **Check existing skills** - Review `skills/` to avoid duplication
2. **Open an issue** - For new skills, discuss the idea first to ensure it fits
3. **Review examples** - Look at existing skills to understand the format and style

## Development Setup

### Initial Setup

When you clone the repository and run `npm install`, git hooks are automatically installed. These hooks run quality checks before you push code, preventing CI failures.

**What gets installed:**

- **Pre-push hook** - Runs all CI checks locally before pushing

**What gets checked:**

1. **Formatting** - Prettier formatting (all `.md`, `.json`, `.js` files)
2. **Spelling** - cspell spell checking (all markdown files)
3. **Markdown linting** - markdownlint validation
4. **Skills validation** - Skill structure compliance via `validate-skills.js`

### Running Checks Manually

You can run all checks at any time:

```bash
npm run check
```

Or run individual checks:

```bash
npm run format:check    # Check formatting
npm run spellcheck      # Check spelling
npm run lint:markdown   # Lint markdown
npm run validate:skills # Validate skill structure
```

### Fixing Issues

**Auto-fix formatting:**

```bash
npm run format
```

**Add words to spell check dictionary:**

Edit `cspell.config.json` and add words to the `words` array.

### Bypassing Hooks (Not Recommended)

If you need to push without running checks (not recommended):

```bash
git push --no-verify
```

⚠️ **Warning:** CI will still run these checks and may fail your PR.

## Creating a New Skill

### 1. Skill Structure

Each skill must follow this structure:

```
skills/your-skill-name/
├── SKILL.md              # Required: Metadata + instructions (<500 lines)
├── references/           # Optional: Documentation loaded on demand
│   ├── framework-a.md
│   └── framework-b.md
├── assets/               # Optional: Templates, schemas, static resources
│   └── project-template.md
├── scripts/              # Optional: Executable code agents can run
│   └── validate.sh
├── evals/
│   └── evals.json        # Required: Skill evaluation metrics (3-5 evals)
└── AGENTS.md             # Optional: Condensed version for Cursor/Copilot
```

This is our convention for progressive skill disclosure — only `name` and `description` at startup, full SKILL.md on activation, and `references/`/`assets/`/`scripts/` on demand.

Skills are loaded progressively — only `name` and `description` at startup (~100 tokens), full SKILL.md on activation (< 5,000 tokens recommended), and `references/`/`assets/`/`scripts/` on demand.

| Directory     | Purpose                                          | When loaded             |
| ------------- | ------------------------------------------------ | ----------------------- |
| `references/` | Additional documentation agents read when needed | On demand via file read |
| `assets/`     | Templates, images, data files, schemas           | On demand               |
| `scripts/`    | Executable code (Python, Bash, JS)               | On demand               |
| `evals/`      | Evaluation metrics for testing skill quality     | Not loaded at runtime   |

#### When to use `references/`

Split into `references/` when SKILL.md exceeds **500 lines** and content has clear, independent sections (e.g., per-framework, per-platform, per-use-case).

**Rules:**

- SKILL.md must be self-contained for general questions — don't require references for simple answers
- Each reference file covers one independent topic, under 200 lines
- Use relative paths from skill root (e.g., `references/ios.md`)
- Tell the agent _when_ to load each file: "Read `references/ios.md` if building an iOS app" — not just "see references/"
- Keep references one level deep; avoid nested reference chains
- Do NOT split skills under 500 lines

### 2. SKILL.md Format

Every SKILL.md must have YAML frontmatter followed by markdown content.

```markdown
---
name: your-skill-name
description: Brief description of what this skill does and when to use it.
---

# Skill Title

[Your skill content here]
```

**Required fields:**

| Field         | Constraints                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | Must match directory name. Lowercase letters, numbers, hyphens only. Max 64 chars. Must not start/end with hyphen or contain consecutive hyphens.                   |
| `description` | Max 1024 chars. Describe what the skill does AND when to use it. Use imperative phrasing ("Use this skill when..."). Include keywords that help agents match tasks. |

**Optional fields:**

| Field           | Purpose                                                         |
| --------------- | --------------------------------------------------------------- |
| `license`       | License name or reference to bundled license file               |
| `compatibility` | Environment requirements (e.g., "Requires Python 3.14+ and uv") |
| `metadata`      | Arbitrary key-value pairs (author, version, etc.)               |
| `allowed-tools` | Space-delimited pre-approved tools (experimental)               |

**Body content:** Keep under 500 lines; move detailed content to `references/`.

### 3. Content Guidelines

**Good skills have:**

- ✅ **Mapbox-specific knowledge** - Focus on what the agent wouldn't know without the skill: API patterns, SDK gotchas, non-obvious edge cases
- ✅ **Gotchas sections** - Environment-specific facts that defy reasonable assumptions (often the highest-value content)
- ✅ **Actionable guidance** - "Use X when Y" not "X is a thing"
- ✅ **Decision trees** - Help AI choose between options. Pick a clear default, mention alternatives briefly
- ✅ **Code examples** - Show ❌ anti-patterns and ✅ solutions
- ✅ **Thresholds/metrics** - "< 100 markers: use HTML Markers, > 100: use Symbol Layer"
- ✅ **Real scenarios** - "When building a restaurant finder..."
- ✅ **Priority levels** - Critical vs High Impact vs Optimization

**Avoid:**

- ❌ Generic information the agent already knows
- ❌ Exhaustive coverage of every edge case — concise stepwise guidance outperforms exhaustive docs
- ❌ Lists without context or prioritization
- ❌ Examples without explanation
- ❌ Ambiguous guidance ("might want to", "could consider")
- ❌ Presenting multiple options as equal — pick a default, mention alternatives briefly

### 4. Example Template

````markdown
---
name: mapbox-example-skill
description: Expert guidance on [specific domain] for Mapbox applications. Use when [building/debugging/reviewing] [specific use cases].
---

# Mapbox [Domain] Skill

Expert guidance on [what this covers]. Use this skill when:

- [Specific use case 1]
- [Specific use case 2]

## Core Principles

### Principle 1: [Name]

[Why this matters]

**Anti-pattern:**

```javascript
// ❌ BAD: [Why this is wrong]
code example
```
````

**Solution:**

```javascript
// ✅ GOOD: [Why this is better]
code example
```

**Impact:** [Performance gain, UX improvement, etc.]

### Decision Matrix

| Scenario     | Use Approach A | Use Approach B |
| ------------ | -------------- | -------------- |
| < 1000 items | ✅             | ❌             |
| 1000-10000   | ⚠️             | ✅             |

## Common Scenarios

### Scenario: [Restaurant Finder]

[Specific guidance for this use case]

## Reference

- [Link to official docs]
- [Link to examples]

````

## Testing Your Skill

Before submitting:

1. **Validate structure:**
   ```bash
   npm install
   npm run validate:skills
````

2. **Check spelling:**

   ```bash
   npm run spellcheck
   ```

   If you have domain-specific terms, add them to `cspell.config.json`.

3. **Lint markdown:**

   ```bash
   npm run lint:markdown
   ```

4. **Run all checks:**

   ```bash
   npm run check
   ```

5. **Test with AI assistant:**
   - Install locally: `npx skills add . -a claude-code` (or your AI assistant)
   - Ask questions the skill should help with
   - Verify the AI uses the skill appropriately

## Skill Evals

Evals measure how much a skill actually improves AI responses by comparing answers with and without the skill loaded. They catch non-discriminating content (things the AI already knows) and guide targeted skill improvements.

### Eval File Structure

Create `skills/your-skill-name/evals/evals.json`:

```json
{
  "skill_name": "mapbox-your-skill-name",
  "evals": [
    {
      "id": 1,
      "prompt": "The exact question posed to the AI, with enough context to be unambiguous",
      "expected_output": "A description of what a correct response looks like",
      "files": [],
      "expectations": [
        "Specific, checkable assertion about the response",
        "Another assertion — each should be independently verifiable"
      ]
    }
  ]
}
```

### Writing Good Evals

**Test Mapbox-specific knowledge**, not general AI knowledge. If the AI can answer correctly without the skill, the eval won't show a delta.

| ❌ Non-discriminating                    | ✅ Discriminating                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------- |
| "Use environment variables for secrets"  | "Use `pk.*` public tokens client-side, `sk.*` secret tokens server-side only" |
| "Choose colors with sufficient contrast" | "Dark theme roads must use `#3a3a3a`, never colored hues"                     |
| "Use batch operations for efficiency"    | "Use `matrix_tool` (25×25) instead of 500 individual `directions_tool` calls" |

**Target 3–5 evals per skill.** More isn't better — focus on the highest-value, most non-obvious guidance in the skill.

**Make expectations specific and binary.** "Mentions routing" is hard to grade. "Recommends `optimization_tool` (not `directions_tool`) for multi-stop reordering" is clear.

### Running Evals

Set your Anthropic API key, then run:

```bash
export ANTHROPIC_API_KEY=your-key-here
npm run eval <skill-name>
```

Example:

```bash
npm run eval mapbox-location-grounding
npm run eval           # Run all evals
npm run eval:verbose   # Run with detailed output
npm run eval:diff      # Show delta vs baseline
```

The runner calls Claude twice per eval — once without the skill (baseline) and once with the
`SKILL.md` injected as a system prompt — then grades each expectation using Claude as a judge.

### Interpreting Results

The runner reports per-eval and overall results:

- **Without skill (baseline)** — % of expectations met without the skill loaded
- **With skill** — % met with the skill loaded
- **Delta** — the difference; higher is better

**Target: +20pp or higher delta.** If delta is near zero, the evals are testing general knowledge
— redesign them to test skill-specific content.

### Two Types of Evals

**Knowledge evals** test whether the model recommends the right approach, tool, or pattern. These
run without any live tools and work well in this runner.

**Tool-execution evals** test whether the model actually calls the correct MCP tool. These require
a live MCP server connection (e.g. Claude Desktop or Claude Code with the Mapbox MCP server
configured). The runner will still show a delta for these evals, but the model may describe tool
calls rather than execute them — treat results as directional, not definitive.

When writing evals, prefer knowledge evals where possible. Reserve tool-execution evals for
critical tool-selection decisions (e.g. "use `matrix_tool` not `directions_tool`") where the
distinction is high-value enough to test even directionally.

## Pull Request Process

1. **Create a branch:**

   ```bash
   git checkout -b add-your-skill-name
   ```

2. **Add your skill:**
   - Create `skills/your-skill-name/SKILL.md`
   - Add any additional resources

3. **Run checks:**

   ```bash
   npm run check
   ```

4. **Commit with clear message:**

   ```bash
   git commit -m "Add [skill-name] skill

   - [Brief description of what the skill covers]
   - [Key topics included]"
   ```

5. **Push and create PR:**

   ```bash
   git push -u origin add-your-skill-name
   ```

   The **pre-push hook** will automatically run all quality checks before pushing. If any check fails, the push will be blocked and you'll need to fix the issues.

   Create a pull request with:
   - Clear description of the skill's purpose
   - Example use cases
   - Any dependencies or prerequisites

6. **CI checks will run:**
   - Formatting validation
   - Spell checking
   - Markdown linting
   - Skills validation (structure compliance)
   - Link checking

   All checks must pass before merge.

## Skill Quality Standards

### Content Quality

- **Accurate** - All technical information must be correct
- **Current** - Reference latest Mapbox APIs and best practices
- **Actionable** - Provide clear guidance, not just information
- **Prioritized** - Help AI make decisions based on impact

### Code Examples

- **Complete** - Examples should be runnable (or clearly marked as snippets)
- **Realistic** - Use real-world scenarios, not toy examples
- **Explained** - Show why, not just what
- **Contrasted** - Show both anti-patterns (❌) and solutions (✅)

### Writing Style

- **Clear and direct** - Avoid marketing language or superlatives
- **Specific** - "Use clustering for > 1,000 markers" not "many markers"
- **Scannable** - Use headings, lists, and tables
- **Consistent** - Follow patterns from existing skills

## Review Process

PRs will be reviewed for:

1. **Structure compliance** - YAML frontmatter, directory naming
2. **Content quality** - Accuracy, actionability, examples
3. **CI checks** - All automated checks must pass
4. **Scope** - Does it fit the repository's purpose?

Reviewers may request changes to improve clarity, accuracy, or alignment with existing skills.

## Code of Conduct

### Our Standards

- **Be respectful** - Treat all contributors with respect
- **Be constructive** - Focus on improving skills, not criticizing people
- **Be collaborative** - Work together to create the best guidance
- **Be patient** - Contributors have varying experience levels

### Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Publishing others' private information
- Spam or off-topic content
- Any conduct that would be unprofessional in a workplace

### Enforcement

Issues or PRs with unacceptable behavior will be closed, and repeat offenders may be blocked from the repository.

## Questions?

- **General questions:** [Open an issue](https://github.com/mapbox/mapbox-agent-skills/issues)
- **Skill ideas:** [Open an issue](https://github.com/mapbox/mapbox-agent-skills/issues) with the "skill proposal" label
- **Security issues:** Report to [Mapbox Security](https://www.mapbox.com/security)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Mapbox development better for AI assistants and developers!
