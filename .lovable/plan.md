## POSITION-SIZE-TEACH-CARD — 6th & final teaching dimension

Add a `PositionSizeCardBody` to `src/components/backtesting/BacktestTeachPanel.tsx` and wire it into the body-picker for `dimension === 'position_size'`. Frontend-first / safe no-op until engine v25.9.0 emits the block (body-picker already returns `null` for unknown dimensions).

### Files touched
- `src/components/backtesting/BacktestTeachPanel.tsx` (only)

No engine, edge function, or SQL changes.

### Changes

**1. Extend `TeachingEntry` interface** with position-size fields:
```
// position-size-specific
contracts?: number;
qty_type?: string;           // "fixed" | others
size_multiple?: number;      // e.g. 2 for 2 contracts
primary_max_dd?: number;
variant_max_dd?: number;
// reuses existing: primary_net, variant_net, direction, significance
```

**2. Add `titleFor('position_size')`** → `"What your position size did"` (place at top of `titleFor` next to the other explicit dimensions).

**3. Add `PositionSizeCardBody({ t })`** mirroring the structural pattern of `SlippageCardBody` / `CommissionCardBody`, using `dollars` / `signedDollars` helpers and the shared `CAPTION` footer. No confidence/significance line (deterministic).

Cases:
- **Neutral / 1-contract fixed** (`direction === 'neutral'` and `qty_type === 'fixed'` and `contracts === 1`):  
  "You traded 1 contract — nothing to compare." + CAPTION.
- **Neutral / non-fixed sizing** (`direction === 'neutral'` and `qty_type !== 'fixed'`):  
  "Position-size comparison isn't available for this sizing method yet." + CAPTION.
- **Main case** (`direction === 'saved' | 'cost'`, size ≠ 1):  
  > Trading **{contracts} contracts** turned a 1-contract result of **{signedDollars(variant_net)}** into **{signedDollars(primary_net)}** — that's **{size_multiple}×** the P&L and about **{size_multiple}×** the max drawdown (**{signedDollars(variant_max_dd)} → {signedDollars(primary_max_dd)}**).  
  > Size multiplies your outcome and your risk, not your edge.
  
  Verdict phrase wrapped in `<strong>` per the "one rule everywhere" style: bold the "**{size_multiple}× the P&L and about {size_multiple}× the max drawdown**" clause (the core verdict). Plus CAPTION footer.
- **Fallback**: `null` (safe no-op).

**4. Wire into body-picker** in the `teachingArr.map` block:
```
: t.dimension === 'position_size' ? (
    <PositionSizeCardBody t={t} />
  )
```
placed after the `slippage` branch. `if (!body) return null;` guard is already in place.

### Non-changes
- Coach chat / admin mock toggle remain attached only to the stop card — unchanged.
- No changes to `stopBlock`, `sameSignal` handling, or ordering (order follows engine's emission order in `_teaching`).

### Verification
1. Preview a completed run — confirm existing 5 cards render unchanged and no 6th card yet (engine still on v25.8.0).
2. No console errors.
3. Publish.

Full render verified later, after engine v25.9.0 ships.
