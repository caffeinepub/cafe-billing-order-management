# Cafe Billing & Order Management

## Current State
App shows offline because backend stable variable names from previous version (`orders`, `menu`, `counter`) may conflict. The backend uses Buffer module correctly but needs clean stable variable names and a fresh deploy.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Backend stable variable names changed to `ordersStable`, `menuStable`, `counterStable` to avoid any potential upgrade conflicts
- Backend redeployed fresh to ensure it compiles and runs correctly

### Remove
- Nothing

## Implementation Plan
1. Write clean backend with renamed stable vars (done)
2. Update frontend declarations to match (backend.did.js, backend.did.d.ts, backend.d.ts) - no changes needed since API signatures are identical
3. Deploy
