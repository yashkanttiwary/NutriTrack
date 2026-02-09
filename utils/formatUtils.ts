
/**
 * Safely adds floating point numbers by converting to integers first.
 * Prevents 0.1 + 0.2 = 0.3000000004 errors.
 */
export const safeAdd = (...nums: number[]): number => {
  const precision = 100; // 2 decimal places
  const sum = nums.reduce((acc, val) => acc + Math.round(val * precision), 0);
  return sum / precision;
};

export const formatMacro = (val: number): string => {
  return val % 1 === 0 ? val.toString() : val.toFixed(1);
};
