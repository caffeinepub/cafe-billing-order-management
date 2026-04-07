# Cafe Billing & Order Management

## Current State
Full-stack cafe billing app with Motoko backend and React frontend. The app has been repeatedly going offline due to backend compilation issues. The current main.mo looks syntactically correct but the user still reports offline status, suggesting either a compilation issue or a canister state problem.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Rewrite `src/backend/main.mo` with a rock-solid, minimal Motoko implementation that avoids any possible compilation edge cases
- Use explicit type annotations everywhere to prevent any ambiguity
- Avoid `Array.filter` with anonymous functions that have complex type inference -- use named helper patterns
- Add `emoji` field to Category type to preserve emoji labels in menu categories

### Remove
- Nothing

## Implementation Plan
1. Rewrite backend main.mo with explicit, fully annotated Motoko code
2. Use `Buffer` module instead of Array.append for safer array operations
3. Ensure all public methods have correct signatures matching the existing frontend bindings
4. Keep the same interface so no frontend changes are needed
