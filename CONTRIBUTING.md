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

## Creating a New Skill

### 1. Skill Structure

Each skill must follow this structure:

```
skills/your-skill-name/
├── SKILL.md              # Required: Main skill file
└── [optional files]      # Optional: Additional resources, diagrams, etc.
```

### 2. SKILL.md Format

Every SKILL.md must have YAML frontmatter followed by markdown content:

```markdown
---
name: your-skill-name
description: Brief one-line description of what this skill covers
---

# Skill Title

[Your skill content here]
```

**Requirements:**

- `name` must match the directory name exactly
- `description` should be concise (1-2 sentences)
- Content must include actionable guidance, not just information

### 3. Content Guidelines

**Good skills have:**

- ✅ **Clear structure** - Use headings to organize topics
- ✅ **Actionable guidance** - "Use X when Y" not "X is a thing"
- ✅ **Decision trees** - Help AI choose between options
- ✅ **Code examples** - Show ❌ anti-patterns and ✅ solutions
- ✅ **Thresholds/metrics** - "< 100 markers: X, > 100: Y"
- ✅ **Real scenarios** - "When building a restaurant finder..."
- ✅ **Priority levels** - Critical vs High Impact vs Optimization

**Avoid:**

- ❌ Generic information available in docs
- ❌ Lists without context or prioritization
- ❌ Examples without explanation
- ❌ Ambiguous guidance ("might want to", "could consider")

### 4. Example Template

````markdown
---
name: mapbox-example-skill
description: Expert guidance on [specific domain] for Mapbox applications
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

   Create a pull request with:
   - Clear description of the skill's purpose
   - Example use cases
   - Any dependencies or prerequisites

6. **CI checks will run:**
   - Spell checking
   - Markdown linting
   - Skills validation (YAML frontmatter)

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
