#!/usr/bin/env bash
# Create git worktree and setup Zellij environment for feature development
# Usage: ./create-worktree-and-setup.sh <feature-name>

set -e

if [ $# -eq 0 ]; then
  echo "Error: Feature name required"
  echo "Usage: $0 <feature-name>"
  exit 1
fi

FEATURE_NAME="$1"
BRANCH_NAME="andre/feat/${FEATURE_NAME}"
WORKTREE_PATH="$PWD/../urban-legends-${FEATURE_NAME}"
MAIN_REPO_PATH="$PWD"

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

# Calculate unique ports based on feature name
OFFSET=$(echo -n "${FEATURE_NAME}" | cksum | awk '{print $1 % 100}')
NEXT_PORT=$((3000 + OFFSET))
CONVEX_PORT=$((3210 + OFFSET))

echo "Ports calculated:"
echo "  Next.js: ${NEXT_PORT}"
echo "  Convex: ${CONVEX_PORT}"
echo ""

# Create new Zellij tab named after the feature
echo "Creating Zellij tab with 3-pane layout..."
zellij action new-tab --name "${FEATURE_NAME}" --cwd "$WORKTREE_PATH"
zellij action write-chars "cd $WORKTREE_PATH"
zellij action write 10

# Split right to create upper-right pane for Next.js dev server
zellij action new-pane --direction right --cwd "$WORKTREE_PATH" --start-suspended -- bash -c "PORT=$NEXT_PORT bun --bun run dev"

# Split the right pane down to create lower-right pane for Convex backend
zellij action new-pane --direction down --cwd "$WORKTREE_PATH" --start-suspended -- bash -c "CONVEX_SITE_PORT=$CONVEX_PORT bun --bun convex dev"

# Focus back to left pane for coding
zellij action focus-next-pane

# Resize to make right panes wider
zellij action resize + right
zellij action resize + right
zellij action resize + right
zellij action resize + right
zellij action resize + right

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
echo "Zellij Layout:"
echo "  - Left pane: Code workspace (nvim)"
echo "  - Upper-right pane: Next.js dev server (http://localhost:${NEXT_PORT})"
echo "  - Lower-right pane: Convex backend (http://localhost:${CONVEX_PORT})"
echo ""
echo "Switch to the '${FEATURE_NAME}' Zellij tab to view the running servers."
echo "Access your app at: http://localhost:${NEXT_PORT}"
echo ""
echo "To clean up after merging:"
echo "  1. Close the Zellij tab (or kill the running processes)"
echo "  2. git worktree remove ../urban-legends-${FEATURE_NAME}"
echo ""
