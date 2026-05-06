#!/bin/bash
set -eo pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

# jq filter to extract streaming text from assistant messages
stream_text='select(.type == "assistant").message.content[]? | select(.type == "text").text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"'

# jq filter to extract final result
final_result='select(.type == "result").result // empty'

# jq filter that formats one issue as readable markdown
format_issue='.[] | "## Issue #\(.number): \(.title)\nLabels: \(.labels | map(.name) | join(", "))\n\n\(.body)\n\n---\n"'

for ((i = 1; i <= $1; i++)); do
  tmpfile=$(mktemp)
  trap "rm -f $tmpfile" EXIT

  commits=$(git log -n 5 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No commits found")
  ready_issues=$(gh issue list --state open --label "ready-for-agent" --limit 200 --json number,title,body,labels --jq "$format_issue" 2>/dev/null || echo "No ready-for-agent issues found")
  open_numbers=$(gh issue list --state open --limit 200 --json number --jq '[.[].number | tostring] | join(", ")' 2>/dev/null || echo "")
  prompt=$(cat ralph/prompt.md)

  context="Previous commits:
$commits

All currently open issue numbers: $open_numbers

Open ready-for-agent issues:
$ready_issues

$prompt"

  claude -p \
    --verbose \
    --model sonnet \
    --permission-mode auto \
    --output-format stream-json \
    "$context" |
    grep --line-buffered '^{' |
    tee "$tmpfile" |
    jq --unbuffered -rj "$stream_text"

  result=$(jq -r "$final_result" "$tmpfile")

  if [[ "$result" == *"<promise>NO MORE TASKS</promise>"* ]]; then
    echo "Ralph complete after $i iterations."
    exit 0
  fi
done
