# Agent Model Assignments

## Overview
This document clarifies which AI model each agent should use based on their role and responsibilities.

## Model Assignment Rules

### 🧠 Opus Model (Superior Analysis)
Use Opus for agents that require deep analysis, architectural decisions, or code review:

#### Agents Using Opus:
1. **nextjs-fullstack-architect** - Complex architectural decisions, performance optimization, and deep Next.js expertise
2. **fullstack-code-reviewer** - Comprehensive code quality review and security analysis
3. **refactoring-specialist** - Code optimization and refactoring recommendations
4. **Parent coordinator/planner agents** - Overall project planning and coordination

### 🚀 Sonnet Model (Implementation)
Use Sonnet for all coding and implementation agents:

#### Agents Using Sonnet:
1. **react-frontend-expert** - React component development
2. **ui-html-generator** - HTML/CSS generation
3. **api-endpoint-builder** - API development
4. **authentication-specialist** - Auth implementation
5. **dashboard-analytics-specialist** - Dashboard features
6. **database-architect** - Database design and queries
7. **notification-system-builder** - Notification features
8. **scss-styling-expert** - Styling and CSS
9. **stripe-integration-specialist** - Payment integration
10. **testing-automation-engineer** - Test implementation

## Workflow

### Standard Development Flow:
1. **Coding Agent (Sonnet)** implements the feature
2. **Tests are written** (preferably TDD - tests first)
3. **Review Agent (Opus)** reviews the code
4. **Feedback** is written to `/temp/review/chunk-XXX-feedback.md`
5. **Coding Agent (Sonnet)** implements improvements
6. **Tests must still pass** after improvements
7. **Iterate** until Review Agent approves
8. **Parent Agent** is notified of completion

### Why This Distribution?

- **Opus for Analysis**: Used where deep understanding, pattern recognition, and strategic thinking are critical
- **Sonnet for Implementation**: Fast, efficient coding while following established patterns
- **Iterative Review Process**: Ensures code quality through Opus review while maintaining development speed with Sonnet

## Important Notes

- The nextjs-fullstack-architect uses Opus because it often makes architectural decisions that affect the entire application
- All review agents use Opus to ensure the highest quality code review
- Implementation agents use Sonnet for speed and efficiency
- This model assignment optimizes for both quality (through Opus review) and speed (through Sonnet implementation)