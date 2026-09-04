export function avg(arr: (number | null)[]): number | undefined {
  const valid = arr.filter((v): v is number => v !== null && v !== undefined);
  return valid.length > 0
    ? Number((valid.reduce((s, v) => s + v, 0) / valid.length).toFixed(2))
    : undefined;
} 