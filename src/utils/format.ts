// "$48.200" gibi formatlar — tr-TR locale binlik ayıracı nokta kullanır.
export function formatCurrency(value: number): string {
  return '$' + value.toLocaleString('tr-TR');
}

export function formatScore(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toLocaleString('tr-TR')}`;
}
