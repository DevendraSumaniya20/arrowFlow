import type { Outcome } from '../services/results';

/** What the result card says after a daily win, matching what really happened. */
export function dailyNote(o: Outcome): string {
  switch (o.status) {
    case 'sent':
      return o.rank ? `You're #${o.rank} today` : 'Result saved to the leaderboard.';
    case 'queued':
      if (o.reason === 'not_joined') {
        return 'Join the leaderboard to see your rank.';
      }
      if (o.reason === 'reauth') {
        return 'Join the leaderboard again to post this result.';
      }
      return "You're offline. It'll be sent when you're back.";
    case 'rejected':
      return o.code === 'daily_closed'
        ? "This daily has closed, so it can't be ranked."
        : "The leaderboard didn't accept this run.";
  }
}
