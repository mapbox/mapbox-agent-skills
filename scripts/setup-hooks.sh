#!/bin/bash
# Setup git hooks for local CI checks

HOOKS_DIR=".git/hooks"
SOURCE_HOOKS_DIR=".githooks"

echo "🔧 Setting up git hooks..."

# Make sure .git/hooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .git/hooks directory not found. Are you in the repository root?"
  exit 1
fi

# Copy pre-push hook
echo "📋 Installing pre-push hook..."
cp "$SOURCE_HOOKS_DIR/pre-push" "$HOOKS_DIR/pre-push"
chmod +x "$HOOKS_DIR/pre-push"
echo "✅ Pre-push hook installed"

echo ""
echo "✨ Git hooks setup complete!"
echo ""
echo "The pre-push hook will now run before every push to ensure:"
echo "  - Code is properly formatted"
echo "  - No spelling errors"
echo "  - Markdown is valid"
echo "  - Skills are valid"
echo ""
echo "To bypass the hook (not recommended), use: git push --no-verify"
