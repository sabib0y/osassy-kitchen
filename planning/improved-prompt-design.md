# Sub-Agent Workflow System Specification

## Core Philosophy
Work should be decomposed into atomic, PR-ready chunks that can be developed in parallel by sub-agents, with each chunk being independently testable, reviewable, and revertible.

## 1. Task Decomposition & Dependency Matrix

### Task Table Structure
```
| Phase | Task A (Independent) | Task B (Depends on A) | Task C (Independent) |
|-------|---------------------|----------------------|---------------------|
| 1     | Setup base config   | -                    | Setup test env      |
| 2     | Create API routes   | Add API middleware   | Create UI mockups   |
| 3     | Implement auth      | Add auth to routes   | Build components    |
| 4     | Database schema     | CRUD operations      | Connect UI to state |
```

### Dependency Rules
- **Horizontal Independence**: Tasks in the same row MUST be executable in parallel
- **Vertical Dependencies**: Tasks in column B can depend on column A from previous phases
- **Phase Gates**: Each phase completion triggers automated quality checks before proceeding

## 2. PR Chunking Strategy

### Chunk Definition Criteria
Each chunk MUST:
- Be a complete, working feature or fix
- Include its own tests
- Not break existing functionality
- Be reviewable in under 30 minutes
- Have clear acceptance criteria

### Chunk Types

#### Type A: Foundation Chunks
```yaml
characteristics:
  - No external dependencies
  - Creates new files/modules
  - Establishes patterns for future work
  
examples:
  - Configuration files
  - Base component libraries
  - Utility functions
  - Type definitions
  
pr_size: 50-200 lines
review_time: 10-15 minutes
```

#### Type B: Feature Chunks
```yaml
characteristics:
  - May depend on foundation chunks
  - Implements business logic
  - User-facing functionality
  
examples:
  - API endpoints
  - UI components
  - Service integrations
  
pr_size: 100-400 lines
review_time: 15-25 minutes
```

#### Type C: Integration Chunks
```yaml
characteristics:
  - Connects multiple systems
  - Requires careful testing
  - May touch multiple files
  
examples:
  - API-UI connections
  - Database integrations
  - Third-party service setup
  
pr_size: 200-500 lines
review_time: 20-30 minutes
```

## 3. Sub-Agent Specifications

### Agent Types & Responsibilities

#### Planning Agent
```yaml
role: Decomposes requirements into task matrix
capabilities:
  - Analyzes codebase structure
  - Identifies dependencies
  - Creates task breakdown
  - Estimates complexity
  
outputs:
  - task_matrix.json
  - dependency_graph.md
  - phase_timeline.md
```

#### Implementation Agents (Parallel)
```yaml
role: Execute assigned tasks from matrix
capabilities:
  - Work on independent tasks simultaneously
  - Follow established patterns
  - Write tests alongside code
  - Document changes
  
constraints:
  - Must not modify files outside assigned scope
  - Must maintain backward compatibility
  - Must include error handling
```

#### Quality Control Agent
```yaml
role: Validates chunk before PR creation
capabilities:
  - Runs automated tests
  - Checks code style
  - Validates dependencies
  - Ensures documentation
  
gates:
  - All tests passing
  - No linting errors
  - Coverage threshold met
  - Documentation complete
```

#### Integration Agent
```yaml
role: Ensures chunks work together
capabilities:
  - Runs integration tests
  - Validates API contracts
  - Checks for conflicts
  - Updates dependency graph
```

## 4. File Specification Guidelines

### File Structure Requirements
```
project/
├── .agent/
│   ├── task-matrix.json        # Current task breakdown
│   ├── dependencies.json       # Dependency graph
│   ├── pr-chunks/              # Staged PR chunks
│   │   ├── chunk-001/
│   │   │   ├── manifest.json   # Chunk metadata
│   │   │   ├── files/          # Modified files
│   │   │   └── tests/          # Associated tests
│   └── quality-reports/        # QC results
```

### Chunk Manifest Schema
```json
{
  "chunk_id": "chunk-001",
  "type": "feature",
  "phase": 2,
  "dependencies": ["chunk-000"],
  "description": "Implement user authentication API",
  "acceptance_criteria": [
    "JWT token generation works",
    "Password hashing implemented",
    "Rate limiting active"
  ],
  "files_modified": [
    "src/api/auth.ts",
    "src/middleware/auth.ts",
    "tests/auth.test.ts"
  ],
  "tests": {
    "unit": ["auth.test.ts"],
    "integration": ["auth-flow.test.ts"],
    "coverage": 85
  },
  "estimated_review_time": "20 minutes",
  "breaking_changes": false
}
```

## 5. Quality Control Automation

### Pre-PR Checks
```yaml
mandatory:
  - Type checking passes
  - Linting (ESLint/Prettier) passes
  - Unit tests pass (100% of new code)
  - Integration tests pass
  - No console.logs in production code
  - No commented-out code
  - Dependencies are declared

recommended:
  - Performance benchmarks met
  - Bundle size within limits
  - Accessibility checks pass
  - Security scan clean
```

### Automated PR Description Generation
```markdown
## 🎯 Purpose
[Auto-generated from chunk manifest]

## ✅ Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## 📝 Changes
- Added: [List of new files]
- Modified: [List of changed files]
- Tests: [Coverage percentage]

## 🔗 Dependencies
- Depends on: #PR-000
- Blocks: None

## 🧪 Testing
- Unit tests: ✅ Passing
- Integration: ✅ Passing
- Coverage: 85%

## 📊 Metrics
- Lines changed: 234
- Review complexity: Medium
- Estimated review time: 20 minutes
```

## 6. Parallel Execution Framework

### Concurrency Rules
```yaml
max_parallel_agents: 5
task_assignment:
  strategy: "least-loaded"
  conflict_resolution: "queue-based"
  
resource_locks:
  - database_schema: exclusive
  - api_routes: shared-read
  - ui_components: independent
```

### Communication Protocol
```json
{
  "agent_id": "impl-agent-001",
  "task_id": "task-2a",
  "status": "in_progress",
  "progress": 65,
  "blockers": [],
  "estimated_completion": "2024-01-10T15:30:00Z",
  "resource_locks": ["src/api/users.ts"]
}
```

## 7. Rollback Strategy

### Chunk Rollback Procedure
1. Identify problematic chunk via automated monitoring
2. Create revert PR automatically
3. Run regression tests on revert
4. Update dependency graph
5. Notify dependent chunks
6. Re-queue affected tasks

### State Management
```yaml
chunk_states:
  - pending: Not started
  - in_progress: Being worked on
  - review: In PR review
  - merged: Successfully integrated
  - reverted: Rolled back
  - blocked: Waiting on dependency
```

## 8. Learning & Optimization

### Metrics Collection
```yaml
per_chunk_metrics:
  - actual_vs_estimated_time
  - review_cycles_required
  - bugs_found_post_merge
  - revert_frequency
  
per_agent_metrics:
  - task_completion_rate
  - code_quality_score
  - test_coverage_average
  - pattern_adherence
```

### Continuous Improvement
- Pattern library updates based on successful chunks
- Dependency prediction refinement
- Task sizing calibration
- Agent specialization tuning

## 9. Example Workflow

### Phase 1: Planning
```bash
# Planning agent analyzes requirements
planning-agent analyze --requirements requirements.md
# Output: task-matrix.json, dependency-graph.md

# Validate task breakdown
validator check-matrix task-matrix.json
# Output: validation-report.json
```

### Phase 2: Parallel Execution
```bash
# Spawn implementation agents for row 1 tasks
spawn-agents --matrix task-matrix.json --row 1
# Agents work in parallel on independent tasks

# Monitor progress
monitor-agents --dashboard
# Real-time view of agent progress
```

### Phase 3: Quality Control
```bash
# Each agent runs QC before creating PR
agent-001 run-qc --chunk chunk-001
# Output: quality-report.json

# Create PR if QC passes
agent-001 create-pr --chunk chunk-001 --auto-describe
# Output: PR #123 created
```

### Phase 4: Integration
```bash
# Integration agent validates merged chunks
integration-agent validate --phase 1
# Output: integration-report.json

# Proceed to next phase if validation passes
coordinator advance-phase --to 2
```

## 10. Error Handling & Recovery

### Agent Failure Scenarios
```yaml
compilation_error:
  detection: Build fails
  action: Revert changes, notify planning agent
  recovery: Re-decompose task with smaller scope

test_failure:
  detection: Tests fail after implementation
  action: Debug mode activation
  recovery: Fix tests or implementation, re-run QC

dependency_conflict:
  detection: Merge conflict detected
  action: Pause dependent agents
  recovery: Resolve conflict, update dependency graph

resource_deadlock:
  detection: Circular dependency detected
  action: Release all locks
  recovery: Reorder task matrix
```

## 11. Configuration Templates

### .agentconfig.yaml
```yaml
project:
  name: "my-project"
  type: "fullstack"
  
agents:
  planning:
    model: "claude-3-opus"
    temperature: 0.2
  
  implementation:
    model: "claude-3-sonnet"
    temperature: 0.3
    max_parallel: 5
  
  quality:
    model: "claude-3-haiku"
    temperature: 0.1

chunks:
  max_size: 500
  max_review_time: 30
  require_tests: true
  min_coverage: 80

quality:
  linter: "eslint"
  formatter: "prettier"
  test_runner: "jest"
  type_checker: "typescript"
```

## 12. Best Practices

### DO's
- ✅ Keep chunks small and focused
- ✅ Write tests before implementation
- ✅ Document acceptance criteria clearly
- ✅ Use semantic commit messages
- ✅ Update dependency graph after changes
- ✅ Run QC checks locally before PR

### DON'Ts
- ❌ Mix refactoring with feature work
- ❌ Create chunks larger than 500 lines
- ❌ Skip writing tests
- ❌ Modify files outside declared scope
- ❌ Ignore dependency warnings
- ❌ Force merge without review

## Implementation Checklist

- [ ] Set up agent configuration
- [ ] Create task matrix from requirements
- [ ] Validate dependency graph
- [ ] Configure quality gates
- [ ] Set up parallel execution environment
- [ ] Create PR templates
- [ ] Configure automated tests
- [ ] Set up monitoring dashboard
- [ ] Create rollback procedures
- [ ] Document agent communication protocol