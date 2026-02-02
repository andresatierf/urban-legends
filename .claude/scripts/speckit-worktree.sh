#!/usr/bin/env bash
# Create git worktree and setup Zellij environment for speckit feature development
# Usage: ./speckit-worktree.sh [branch-name]
# Note: If no branch name provided, uses current branch
#       Branch name should follow speckit convention (e.g., 001-feature-name)
#       Branch creation and numbering is handled by speckit's create-new-feature.sh

set -e

# Use provided branch name or current branch
if [ $# -eq 0 ]; then
  BRANCH_NAME="$(git branch --show-current)"

  if [ -z "$BRANCH_NAME" ]; then
    echo "Error: Could not determine current branch"
    echo "Usage: $0 [branch-name]"
    echo "Example: $0 001-user-auth"
    exit 1
  fi

  if [ "$BRANCH_NAME" = "main" ] || [ "$BRANCH_NAME" = "master" ]; then
    echo "Error: Cannot create worktree for main/master branch"
    echo "Please switch to a feature branch first or specify a branch name"
    echo "Usage: $0 [branch-name]"
    exit 1
  fi

  echo "Using current branch: ${BRANCH_NAME}"
else
  BRANCH_NAME="$1"
fi

MAIN_REPO_PATH="$PWD"
PROJECT_NAME="$(basename "$PWD")"
WORKTREE_PATH="$PWD/../${PROJECT_NAME}-${BRANCH_NAME}"

echo "=================================="
echo "Creating speckit worktree"
echo "=================================="
echo "Branch: ${BRANCH_NAME}"
echo "Worktree path: ${WORKTREE_PATH}"
echo ""

# Checkout main/master branch before creating worktree
echo "Checking out base branch in main repository..."
if git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
  BASE_BRANCH="master"
else
  echo "Error: Neither 'main' nor 'master' branch found"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "$CURRENT_BRANCH" != "$BASE_BRANCH" ]; then
  echo "Switching from '${CURRENT_BRANCH}' to '${BASE_BRANCH}'..."
  git checkout "$BASE_BRANCH"
else
  echo "Already on '${BASE_BRANCH}' branch"
fi
echo ""

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
  echo "⚠️  Worktree already exists at: ${WORKTREE_PATH}"
  read -p "Do you want to continue with the existing worktree? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
else
  # Create worktree (branch may already exist from speckit)
  echo "Creating git worktree..."
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    # Branch exists, check it out
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
  else
    # Branch doesn't exist, create it
    git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
  fi

  # Copy .env file to worktree
  if [ -f ".env" ]; then
    echo "Copying .env file..."
    cp .env "$WORKTREE_PATH/.env"
  elif [ -f ".env.local" ]; then
    echo "Copying .env.local file..."
    cp .env.local "$WORKTREE_PATH/.env.local"
  else
    echo "⚠️  No .env file found in main repo"
  fi

  # Copy .claude/settings.local.json file to worktree
  if [ -f ".claude/settings.local.json" ]; then
    echo "Copying .calude/settings.local.json file..."
    cp .claude/settings.local.json "$WORKTREE_PATH/.claude/settings.local.json"
  fi

  # Install dependencies
  echo "Installing dependencies..."
  cd "$WORKTREE_PATH"
  bun install

  echo ""
  echo "✓ Worktree created successfully"

  # Return to main repo
  cd "$MAIN_REPO_PATH"
fi

echo ""
echo "=================================="
echo "Setting up Zellij environment"
echo "=================================="
echo ""

# Create new Zellij tab named after the feature
echo "Creating Zellij tab with multi-pane layout for speckit workflow..."
zellij action new-tab --name "${BRANCH_NAME}" --cwd "$WORKTREE_PATH"

# Pane 1 (current): Editor for spec/plan/tasks
zellij action write-chars "cd $WORKTREE_PATH"
zellij action write 10
zellij action write-chars "nvim"
zellij action write 10

# Pane 2: Claude Code session
zellij action new-pane --direction right --cwd "$WORKTREE_PATH"
zellij action write-chars "cd $WORKTREE_PATH"
zellij action write 10
zellij action write-chars "claude"
zellij action write 10

# Return focus to editor pane
zellij action focus-previous-pane

echo ""
echo "=================================="
echo "✓ Speckit Worktree Setup Complete!"
echo "=================================="
echo ""
echo "Worktree: ${WORKTREE_PATH}"
echo "Branch: ${BRANCH_NAME}"
echo ""
echo "Zellij Layout:"
echo "  - Pane 1: Editor (nvim) - Edit spec.md, plan.md, tasks.md"
echo "  - Pane 2: Claude Code - Run speckit commands (/speckit.specify, /speckit.plan, etc.)"
echo ""
echo "Switch to the '${BRANCH_NAME}' Zellij tab to start working."
echo ""
echo "Speckit Workflow:"
echo "  1. Run '/speckit.specify' to create spec.md"
echo "  2. Run '/speckit.clarify' to refine the spec"
echo "  3. Run '/speckit.plan' to create plan.md"
echo "  4. Run '/speckit.tasks' to generate tasks.md"
echo "  5. Commit the spec/plan/tasks to the branch"
echo ""
echo "To clean up after merging:"
echo "  1. Close the Zellij tab"
echo "  2. git worktree remove ${PROJECT_NAME}-${BRANCH_NAME}"
echo "  3. git branch -d ${BRANCH_NAME}"
echo ""
