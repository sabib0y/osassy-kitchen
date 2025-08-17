# E2E Test Fix Strategy

## Current Status Analysis

### Primary Issues Identified

1. **Database Connection Crisis**
   - Too many Prisma connections being opened
   - Causing authentication failures in global setup
   - Preventing test suite from even starting properly

2. **Test Credential Mismatch**
   - Tests use `test@test.com / test` but setup tries `test@example.com`
   - Admin credentials inconsistent across files
   - Need to standardise credentials

3. **Selector Fragility**
   - Tests use generic selectors like `h1`, `text=`
   - Missing data-testid attributes for reliable selection
   - Navigation timing issues

4. **Authentication Flow Problems**
   - Global setup can't complete authentication
   - Tests depend on authentication state that fails to establish
   - Inconsistent timeout handling

## Fix Priority Order (Easiest First)

### Phase 1: Critical Infrastructure (Must Fix First)
1. **Database Connection Fix** - Critical blocker
2. **Credential Standardisation** - Essential for any test to work
3. **Global Setup Repair** - Required for test foundation

### Phase 2: Core Test Fixes
4. **Update Login Test Selectors** - Low-hanging fruit
5. **Fix Error Message Expectations** - Quick wins
6. **Add Proper Wait Conditions** - Moderate effort

### Phase 3: Resilience Improvements
7. **Navigation Timing Fixes** - Complex but important
8. **Add Fallback Selectors** - Defensive testing
9. **Improve Error Handling** - Edge case coverage

## Fix Approach for Each Category

### 1. Database Connection Issues
**Problem**: Prisma connection pool exhaustion
**Solution Strategy**:
- Check and fix Prisma client instantiation
- Implement proper connection cleanup
- Add connection pooling configuration
- Consider test database isolation

**Files to Check**:
- `src/lib/prisma.ts`
- Database configuration
- Test environment setup

### 2. Credential Standardisation
**Problem**: Inconsistent test user credentials
**Solution Strategy**:
- Define standard test credentials in `.env.test`
- Update all test files to use consistent credentials
- Ensure test users exist in database

**Standard Credentials**:
```
TEST_USER_EMAIL=test@test.com
TEST_USER_PASSWORD=test
TEST_ADMIN_EMAIL=osasp419@gmail.com
TEST_ADMIN_PASSWORD=test
```

### 3. Selector Strategy
**Problem**: Fragile CSS selectors
**Solution Strategy**:
- Use data-testid attributes where possible
- Implement hierarchical selector fallbacks
- Add timeout and retry logic

**Selector Priority**:
1. `[data-testid="specific-id"]` (most reliable)
2. `input[name="email"]` (semantic)
3. `input[type="email"]` (fallback)
4. Complex CSS selectors (last resort)

### 4. Wait Condition Improvements
**Problem**: Race conditions and timing issues
**Solution Strategy**:
- Replace generic waits with specific conditions
- Wait for API responses not just DOM changes
- Implement retry mechanisms

## Test Categories and Expected Fixes

### Login Tests (10 tests total)
| Test | Expected Issue | Fix Strategy | Confidence |
|------|----------------|--------------|------------|
| Display login form | Selector mismatch | Update selectors | High |
| Valid credentials | Navigation timing | Add proper waits | High |
| Invalid credentials | Error message text | Update expectation | High |
| Empty fields validation | Browser validation | Add fallbacks | Medium |
| Navigate to signup | Simple navigation | Quick fix | High |
| Password visibility | Optional feature | Graceful handling | Medium |
| Redirect authenticated | Complex flow | Multi-step fix | Low |
| Session timeout | Cookie handling | Authentication flow | Medium |
| Network errors | Error simulation | Error handling | Low |
| Remember user | Persistence | State management | Medium |

**Target**: 8/10 passing (80% pass rate)
**Likely achievable**: 6-7/10 (60-70%)

## Success Metrics

### Minimum Acceptable (80% target)
- Login tests: 8/10 passing
- Core authentication flows working
- No infrastructure failures

### Stretch Goals (90%+ target)
- All basic login/logout flows working
- Error handling tests passing
- Edge case coverage functional

## Implementation Timeline

### Immediate (Next 30 minutes)
1. Fix database connection issues
2. Standardise test credentials
3. Update global setup

### Short-term (Next hour)
4. Fix basic login test selectors
5. Update error message expectations
6. Add proper wait conditions

### Medium-term (If time permits)
7. Implement advanced selector strategies
8. Add retry mechanisms
9. Test other suites (user/admin)

## Risk Assessment

### High Risk Items
- Database issues may require infrastructure changes
- Authentication flows deeply interconnected
- Timing issues may be environment-specific

### Mitigation Strategies
- Focus on quick wins first
- Implement graceful degradation
- Document all changes for future maintenance

### Fallback Plan
If 80% not achievable:
- Document all attempted fixes
- Provide working examples for future development
- Create foundation for future test improvement

## Testing Approach

### Iterative Testing Strategy
1. Fix one issue at a time
2. Run specific test after each fix
3. Document results immediately
4. Only move to next fix after verification

### Verification Commands
```bash
# Test specific login functionality
npm run test:e2e -- specs/auth/login.spec.ts --grep "should login successfully"

# Test all login flows
npm run test:e2e -- specs/auth/login.spec.ts

# Quick health check
npm run test:e2e -- specs/auth/login.spec.ts --reporter=line
```

## Expected Outcomes

### Conservative Estimate
- 6-7 tests passing (60-70%)
- Core login functionality working
- Infrastructure stabilised

### Optimistic Estimate
- 8-9 tests passing (80-90%)
- Most edge cases handled
- Reusable patterns established

### Key Deliverables
1. Working test foundation
2. Documented fix patterns
3. Improved test resilience
4. Clear maintenance guidelines

---

**Next Steps**: Begin with database connection analysis and credential standardisation.