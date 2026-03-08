# Sleep — End of Session Wrap-up

Run the tracking update and provide a comprehensive session summary before signing off, including any incomplete work.

## Steps

### 1. Capture Current Context

**CRITICAL:** Before summarising, capture the full state of the session:

- Check the **current todo list** for any in-progress or pending items
- Review the **conversation context** for any discussed but unstarted work
- Note any **blockers, decisions needed, or open questions**
- Identify any **partially completed tasks** and their current state

### 2. Run /track Logic

Evaluate whether tracking docs need updating (follow `/track` criteria):

- Review conversation context for work done this session
- If meaningful work was done (code, fixes, config, features): update relevant docs
- If nothing worth logging: note "No tracking updates needed"

### 3. Session Summary

Provide a comprehensive summary based on:
- Conversation context (what was discussed/implemented)
- Latest progress log entry (if just updated or already exists for today)
- **Current todo list state** (in-progress and pending items)

## Summary Format

```markdown
## Session Summary — [Date]

### Done
- [Bullet list of completed work]

### In Progress
- [Any tasks that were started but not finished]
- [Include current state/progress for each]

### Pending / Not Started
- [Tasks discussed but not yet begun]
- [Upcoming work from the plan]

### Files Touched
- [Key files created or modified, if any]

### Status
- [Current state: what's working, what's pending]

### Blockers / Open Questions
- [Any decisions needed or issues to resolve]

### Next Session
- [Specific starting point — what to pick up first]
- [Context needed to continue (e.g., "resume from step 3 of X")]
```

## Guidelines

- **Capture incomplete work thoroughly** — this is critical for session continuity
- Include enough detail in "In Progress" items that someone can resume without re-reading the whole conversation
- "Pending" should include both planned work and any newly identified tasks
- "Next Session" should be specific and actionable
- If tests were run, mention the result briefly
- Use British English

## Output Order

1. First, state whether tracking docs were updated (and which ones)
2. Then provide the session summary with all sections

Example:

```markdown
**Tracking:** Updated PROGRESS_LOG.md

## Session Summary — 2025-01-15

### Done
- Implemented user authentication flow
- Added login form component

### In Progress
- Dashboard layout (70% complete — header and sidebar done, main content area pending)

### Pending / Not Started
- User profile page
- Settings page
- API integration for user data

### Files Touched
- src/components/LoginForm.tsx
- src/pages/login.tsx

### Status
- Auth flow working locally, needs testing with real API

### Blockers / Open Questions
- Need to decide on state management approach (Context vs Redux)

### Next Session
- Complete dashboard main content area
- Start on user profile page
```
