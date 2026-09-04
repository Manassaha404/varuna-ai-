export function max(arr: (number | null)[]): number | undefined {
  const valid = arr.filter((v): v is number => v !== null && v !== undefined);
  return valid.length > 0 ? Math.max(...valid) : undefined;
}