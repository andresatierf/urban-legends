#!/bin/bash

# jq filter that formats one issue as readable markdown
format_issue='.[] | "## Issue #\(.number): \(.title)\nLabels: \(.labels | map(.name) | join(", "))\n\n\(.body)\n\n---\n"'

commits=$(git log -n 5 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No commits found")
ready_issues=$(gh issue list --state open --label "ready-for-agent" --limit 200 --json number,title,body,labels --jq "$format_issue" 2>/dev/null || echo "No ready-for-agent issues found")
open_numbers=$(gh issue list --state open --limit 200 --json number --jq '[.[].number | tostring] | join(", ")' 2>/dev/null || echo "")
prompt=$(cat ralph/prompt.md)

claude --model sonnet --permission-mode auto \
  "Previous commits:
$commits

All currently open issue numbers: $open_numbers

Open ready-for-agent issues:
$ready_issues

$prompt"
