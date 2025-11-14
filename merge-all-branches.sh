#!/bin/bash

# Merge all remaining test branches
branches=(
  "claude/test-progress-bar-014vSaEKoBZuqkwF7CwMERj4"
  "claude/test-cm-update-01V7jdMmH3qYxZjMUgZGXKZo"
  "claude/test-cm-gitingest-01E8pNU6bJ3XuoUoL1deiqms"
  "claude/test-config-utils-01XFgZXewWYYKbADgHEEKXTC"
  "claude/test-error-scenarios-012tM7wjM2A8oRXceDBE4x3E"
  "claude/e2e-workflow-tests-01E5ujswoZuRojmXF6rrSadx"
  "claude/dashboard-comprehensive-tests-013UqHcfXiAUjvY4iVnnKMPQ"
  "claude/wizard-comprehensive-tests-01DammcamSi2ZZojuVfRTJdM"
  "claude/testing-mhy1yj0ciltmejya-01UVEHKYtD9vC36Unb8FiWth"
  "claude/testing-mhy1z7zos5ayhxu5-01HeGWNPE9khtR6rkEdFpxLY"
  "claude/testing-mhy24bqf623j0n2p-0167DTNTbdDsvKJempJqaFdQ"
  "claude/testing-mhy25c9tq9d5xvnz-01LPGULhxCSTP3QZ5Y9cTSZr"
  "claude/testing-mhy29uvdrxiui2ba-01TA6AfuZHzSQsx9LDuwqnVZ"
)

for branch in "${branches[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Merging: $branch"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Attempt merge
  git merge --no-ff --no-commit origin/$branch 2>&1 | tee /tmp/merge-output.txt

  # Check if there are conflicts
  if grep -q "CONFLICT" /tmp/merge-output.txt; then
    echo "⚠️  Conflicts detected, resolving..."

    # Resolve package-lock.json conflicts (always use theirs for simplicity)
    if git status --short | grep -q "UU package-lock.json"; then
      git checkout --theirs package-lock.json
      git add package-lock.json
      echo "  ✅ Resolved package-lock.json"
    fi

    # Check for other conflicts
    remaining_conflicts=$(git status --short | grep "^UU\|^AA" | wc -l)
    if [ "$remaining_conflicts" -gt 0 ]; then
      echo "❌ Manual resolution required for:"
      git status --short | grep "^UU\|^AA"
      echo "Aborting script. Please resolve manually."
      exit 1
    fi
  fi

  # Commit the merge
  git commit -m "Merge $branch: Consolidate test improvements" --no-edit || true

  echo "✅ Merged successfully"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All branches merged successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
