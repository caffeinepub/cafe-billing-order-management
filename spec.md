# Cafe Billing & Order Management

## Current State
- Backend uses Motoko Buffer module with stable variables: `orders`, `menu`, `counter`
- ReportTab shows growth indicator using 📈/📉 emoji with colored text
- App has persistent offline issues despite multiple backend rewrites

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- **Backend**: Rename stable variables to `ordersV4`, `menuV4`, `counterV4` to force a clean state and avoid any upgrade conflict with previous canister state
- **ReportTab**: Replace emoji 📈/📉 with solid colored SVG inline arrows — green solid upward-right arrow for increase, red solid downward-right arrow for decrease (no emoji, pure solid color)

### Remove
- Nothing removed

## Implementation Plan
1. Rewrite `src/backend/main.mo` with fresh stable variable names (`ordersV4`, `menuV4`, `counterV4`)
2. Update `ReportTab.tsx` to replace emoji chart indicators with solid-color SVG trend arrows (green up, red down)
