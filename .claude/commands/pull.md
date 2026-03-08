# Pull Request Context

Fetch an active pull request and load all relevant context for review or continued work.

**Argument:** `$ARGUMENTS` (GitHub PR link, e.g., https://github.com/user/repo/pull/123)

## Instructions

1. **Parse the PR link** to extract:
   - Repository owner/organisation
   - Repository name
   - PR number

2. **Fetch PR details**:
   ```bash
   gh pr view <PR-NUMBER> --repo <OWNER>/<REPO> --json title,body,author,headRefName,baseRefName,state,additions,deletions,changedFiles,commits,labels,reviewDecision,reviews
   ```

3. **Display PR summary**:
   - Title and author
   - Branch: `headRefName` → `baseRefName`
   - State and review decision
   - Stats: additions, deletions, changed files, commits
   - Labels (if any)

4. **Fetch the changed files**:
   ```bash
   gh pr diff <PR-NUMBER> --repo <OWNER>/<REPO> --name-only
   ```

5. **Check git status** for uncommitted changes:
   ```bash
   git status --porcelain
   ```

   **If there are uncommitted changes:**
   - Stop and flag this to the user
   - Show them what's uncommitted
   - Suggest stashing before proceeding:
     ```bash
     git stash push -m "WIP before pulling PR #<PR-NUMBER>"
     ```
   - Ask for confirmation before continuing
   - Do not proceed until the user confirms

6. **Fetch and checkout the PR branch**:
   ```bash
   gh pr checkout <PR-NUMBER> --repo <OWNER>/<REPO>
   ```

7. **Load project context**:
   - Read `CLAUDE.md` for project understanding
   - Check `planning/current-context/PROGRESS_LOG.md` for recent work
   - Read `planning/current-context/project-plan.md` for current phase

8. **Fetch PR comments and review threads**:
   ```bash
   gh pr view <PR-NUMBER> --repo <OWNER>/<REPO> --comments
   ```

9. **Summarise** to the user:
   - PR title, author, and current state
   - Key changes (files modified, additions/deletions)
   - Any review comments or requested changes
   - Any project context found
   - The session is now ready for work on this PR

## Notes
- Always check for clean git status before checking out
- Never force checkout or discard changes without user confirmation
- Use British English throughout
- If the PR has review comments, highlight any unresolved threads
