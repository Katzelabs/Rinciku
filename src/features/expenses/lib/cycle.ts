export type Cycle = {
  year: number;
  month: number;
};

export function getCycleRange(
  year: number,
  month: number,
  startDay: number
): { from: Date; to: Date } {
  const from = new Date(year, month - 1, startDay, 0, 0, 0, 0);
  const nextStart = new Date(year, month, startDay, 0, 0, 0, 0);
  const to = new Date(nextStart.getTime() - 1);
  return { from, to };
}

export function getCurrentCycle(now: Date, startDay: number): Cycle {
  const day = now.getDate();
  if (day >= startDay) {
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
}
