#!/bin/bash

echo "=== Analyzing all branches ==="
echo ""

branches=(
  "claude/dashboard-comprehensive-tests-013UqHcfXiAUjvY4iVnnKMPQ"
  "claude/e2e-workflow-tests-01E5ujswoZuRojmXF6rrSadx"
  "claude/laravel-backup-setup-011CV46gepSpuM5scvVchjyq"
  "claude/test-cm-gitingest-01E8pNU6bJ3XuoUoL1deiqms"
  "claude/test-cm-update-01V7jdMmH3qYxZjMUgZGXKZo"
  "claude/test-config-utils-01XFgZXewWYYKbADgHEEKXTC"
  "claude/test-error-scenarios-012tM7wjM2A8oRXceDBE4x3E"
  "claude/test-progress-bar-014vSaEKoBZuqkwF7CwMERj4"
  "claude/test-select-input-01LMQmWkzwghB5isJRgLYEhn"
  "claude/testing-mhy1yj0ciltmejya-01UVEHKYtD9vC36Unb8FiWth"
  "claude/testing-mhy1z7zos5ayhxu5-01HeGWNPE9khtR6rkEdFpxLY"
  "claude/testing-mhy24bqf623j0n2p-0167DTNTbdDsvKJempJqaFdQ"
  "claude/testing-mhy25c9tq9d5xvnz-01LPGULhxCSTP3QZ5Y9cTSZr"
  "claude/testing-mhy29uvdrxiui2ba-01TA6AfuZHzSQsx9LDuwqnVZ"
  "claude/wizard-comprehensive-tests-01DammcamSi2ZZojuVfRTJdM"
  "enhance-test-coverage"
)

for branch in "${branches[@]}"; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Branch: $branch"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Show commits
  echo "Commits:"
  git log --oneline origin/main..origin/$branch 2>/dev/null | head -10

  echo ""
  echo "Changed files:"
  git diff --name-only origin/main..origin/$branch 2>/dev/null

  echo ""
  echo "Summary:"
  git diff --stat origin/main..origin/$branch 2>/dev/null | tail -1

  echo ""
  echo ""
done
