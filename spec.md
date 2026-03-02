# Cafe Billing & Order Management

## Current State
Full-stack cafe POS app with:
- Order tab with categories, item grid, payment selection (Cash/Online), finalize with thermal receipt
- Report tab (login-protected) with daily breakdown, item totals, cash vs online summary, refresh button
- Order Details tab with per-day grouping, delete individual/day orders, refresh button
- Menu Management tab for adding categories and items
- Backend stores orders and menu in canister; frontend polls every 2 seconds for real-time sync

The backend (main.mo) is broken: it uses `List.empty<Order>()` with mutable methods (`.add()`, `.filter()`, `.clear()`, `.addAll()`) that do not exist in `mo:core/List`, which is immutable. Additionally, `orders` and `menu` are not declared as `stable`, meaning all data is lost on canister upgrade. This causes the canister to fail at runtime, showing "Offline" status and blocking login.

## Requested Changes (Diff)

### Add
- Nothing new -- fix only

### Modify
- Rewrite backend to use `stable var ordersStable : [Order] = []` and `stable var menuStable : [Category] = []`
- Replace all mutable List operations with immutable `Array.filter`, `Array.append`
- Declare `orderCounter` as stable
- Remove unused imports (`List`, `Iter`)
- Keep all existing API signatures unchanged (login, getOrders, addOrder, deleteOrder, deleteOrdersByDate, getMenu, saveMenu, getNextOrderNumber)
- Seed default menu in `postupgrade` only when `menuStable.size() == 0`, using the correct full menu from the last user-provided menu spec

### Remove
- `List` and `Iter` imports
- All mutable List method calls

## Implementation Plan
1. Regenerate backend Motoko using `generate_motoko_code` with correct stable variable patterns and the full correct menu seed data
2. Redeploy app so the fixed canister goes live
