/** Clamp company balances only; signed reward and penalty deltas stay unchanged. */
export function clampBudget(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
