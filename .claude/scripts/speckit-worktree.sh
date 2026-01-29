#!/usr/bin/env bash
# Create git worktree and setup Zellij environment for speckit feature development
# Usage: ./speckit-worktree.sh <feature-name>
# Note: Uses speckit branch naming convention: <number>-<feature-name>

set -e

if [ $# -eq 0 ]; then
  echo "Error: Feature name required"
  echo "Usage: $0 <feature-name>"
  exit 1
fi

FEATURE_NAME="$1"
MAIN_REPO_PATH="$PWD"

# Find the highest existing branch number for this feature name
echo "Checking for existing branches with name: ${FEATURE_NAME}..."
git fetch --all --quiet 2>/dev/null || true

# Check remote and local branches for the pattern
HIGHEST_NUM=$(git ls-remote --heads origin 2>/dev/null | grep -oE "refs/heads/[0-9]+-${FEATURE_NAME}\$" | grep -oE "[0-9]+" | sort -n | tail -1)
LOCAL_NUM=$(git branch | grep -oE "[0-9]+-${FEATURE_NAME}\$" | grep -oE "[0-9]+" | sort -n | tail -1)

# Use the highest number found, or start at 1
if [ -n "$HIGHEST_NUM" ] && [ -n "$LOCAL_NUM" ]; then
  BRANCH_NUM=$((HIGHEST_NUM > LOCAL_NUM ? HIGHEST_NUM : LOCAL_NUM))
elif [ -n "$HIGHEST_NUM" ]; then
  BRANCH_NUM=$HIGHEST_NUM
elif [ -n "$LOCAL_NUM" ]; then
  BRANCH_NUM=$LOCAL_NUM
else
  BRANCH_NUM=0
fi

# Increment for new branch
BRANCH_NUM=$((BRANCH_NUM + 1))
BRANCH_NAME="${BRANCH_NUM}-${FEATURE_NAME}"
WORKTREE_PATH="$PWD/../urban-legends-${BRANCH_NAME}"

echo "=================================="
echo "Creating worktree for: ${FEATURE_NAME}"
echo "=================================="
echo "Branch: ${BRANCH_NAME}"
echo "Worktree path: ${WORKTREE_PATH}"
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
  # Create worktree with new branch
  echo "Creating git worktree..."
  git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"

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
echo "Creating Zellij tab with 3-pane layout..."
zellij action new-tab --name "${FEATURE_NAME}" --cwd "$WORKTREE_PATH"
zellij action write-chars "cd $WORKTREE_PATH"
zellij action write 10

# Open nvim in the editor pane
zellij action write-chars "nvim"
zellij action write 10

echo ""
echo "=================================="
echo "✓ Setup Complete!"
echo "=================================="
echo ""
echo "Worktree: ${WORKTREE_PATH}"
echo "Branch: ${BRANCH_NAME}"
echo ""
echo "Switch to the '${FEATURE_NAME}' Zellij tab to view the running servers."
echo ""
echo "To clean up after merging:"
echo "  1. Close the Zellij tab (or kill the running processes)"
echo "  2. git worktree remove ../urban-legends-${FEATURE_NAME}"
echo ""
