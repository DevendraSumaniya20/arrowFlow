/** Spoiler-free text for sharing a daily result (no board, no moves). */
export function dailyShareText(
  r: { date: string; stars: number; score: number; rank?: number | null; streak: number },
  locale?: string,
): string {
  const day = new Date(`${r.date}T00:00:00Z`).toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const lines = [
    `Arrow Flow · Daily ${day}`,
    `${'★'.repeat(r.stars)}${'☆'.repeat(3 - r.stars)} ${r.score.toLocaleString(locale)} points${r.rank ? ` · #${r.rank} today` : ''}`,
  ];
  if (r.streak >= 2) {
    lines.push(`🔥 ${r.streak}-day streak`);
  }
  return lines.join('\n');
}
