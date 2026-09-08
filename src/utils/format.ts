// "$48.200" gibi formatlar — tr-TR locale binlik ayıracı nokta kullanır.
export function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('tr-TR');
}

export function formatBudget(value: number): string {
  return value.toLocaleString('tr-TR');
}

export function formatScore(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('tr-TR')}`;
}

export function formatSessionMetric(value: number, label: string): string {
  const formattedValue = Math.abs(value).toLocaleString('tr-TR');
  return value < 0 ? `${formattedValue} ${label} kaybı` : `${formattedValue} ${label}`;
}
