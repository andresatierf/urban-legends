#!/usr/bin/env bash

# get-commit-info.sh
# Gathers all git information needed for creating a smart commit message
# Usage: .claude/scripts/get-commit-info.sh

set -euo pipefail

# Colors for output
BOLD='\033[1m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper function to print section headers
print_section() {
    echo ""
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${GREEN}$1${NC}"
    echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Section 1: Git Status
print_section "📋 Git Status"
git --no-pager status

# Section 2: Staged Files Summary
print_section "📦 Staged Files"
if git --no-pager diff --cached --name-only | head -1 > /dev/null 2>&1; then
    git --no-pager diff --cached --name-status
else
    echo -e "${YELLOW}No files staged for commit${NC}"
fi

# Section 3: Staged Changes (Diff)
print_section "📝 Staged Changes (git diff --cached)"
if git --no-pager diff --cached --name-only | head -1 > /dev/null 2>&1; then
    # Show stats first
    echo -e "${BOLD}Statistics:${NC}"
    git --no-pager diff --cached --stat
    echo ""

    # Show full diff
    echo -e "${BOLD}Full Diff:${NC}"
    git --no-pager diff --cached
else
    echo -e "${YELLOW}No staged changes to diff${NC}"
fi

# Section 4: Recent Commits (for commit message style)
print_section "📜 Recent Commits (for style reference)"
git --no-pager log --oneline -10

# Section 5: Current Branch
print_section "🌿 Branch Information"
echo -e "Current branch: ${GREEN}$(git branch --show-current)${NC}"
echo -e "Upstream branch: ${GREEN}$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo 'none')${NC}"

# Section 6: Summary
print_section "📊 Summary"
staged_count=$(git --no-pager diff --cached --name-only | wc -l | tr -d ' ')
unstaged_count=$(git --no-pager diff --name-only | wc -l | tr -d ' ')
untracked_count=$(git --no-pager ls-files --others --exclude-standard | wc -l | tr -d ' ')

echo -e "Staged files:    ${GREEN}${staged_count}${NC}"
echo -e "Unstaged files:  ${YELLOW}${unstaged_count}${NC}"
echo -e "Untracked files: ${RED}${untracked_count}${NC}"

# Check for sensitive files
print_section "🔒 Security Check"
sensitive_files=(.env .env.local .env.production credentials.json secrets.json id_rsa id_ecdsa id_ed25519 *.pem *.key)
found_sensitive=false

for pattern in "${sensitive_files[@]}"; do
    if git --no-pager diff --cached --name-only | grep -E "^${pattern}$" > /dev/null 2>&1; then
        echo -e "${RED}⚠️  WARNING: Potentially sensitive file staged: ${pattern}${NC}"
        found_sensitive=true
    fi
done

if [ "$found_sensitive" = false ]; then
    echo -e "${GREEN}✓ No sensitive files detected in staged changes${NC}"
fi

# Final message
echo ""
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✨ Ready to commit!${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
