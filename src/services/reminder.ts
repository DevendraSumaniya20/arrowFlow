import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
} from '@notifee/react-native';
import { planReminders, REMINDER_DAYS, ReminderTime } from '../domain/reminder';

const IDS = Array.from({ length: REMINDER_DAYS }, (_, i) => `daily-reminder-${i}`);
const CHANNEL = 'daily-reminder';

const allowed = (status: AuthorizationStatus) =>
  status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;

/**
 * Asks for permission (iOS prompt / Android 13+ runtime permission). The OS
 * shows the prompt only once; later calls just report the current answer.
 */
export async function ensureReminderPermission(): Promise<boolean> {
  if (allowed((await notifee.getNotificationSettings()).authorizationStatus)) {
    return true;
  }
  return allowed((await notifee.requestPermission()).authorizationStatus);
}

export const cancelReminders = () => notifee.cancelTriggerNotifications(IDS);

/**
 * Replaces the scheduled reminders with the next week's plan. Called on launch,
 * when the app returns, after a daily win and when the setting changes, so the
 * plan always reflects which days are already cleared.
 */
export async function syncReminders(
  enabled: boolean,
  time: ReminderTime,
  cleared: Record<string, unknown>,
  now = new Date(),
): Promise<number> {
  await cancelReminders();
  if (!enabled || !allowed((await notifee.getNotificationSettings()).authorizationStatus)) {
    return 0;
  }
  const channelId = await notifee.createChannel({
    id: CHANNEL,
    name: 'Daily reminder',
    importance: AndroidImportance.DEFAULT,
  });
  const plan = planReminders(now, time, cleared);
  await Promise.all(
    plan.map((date, i) =>
      notifee.createTriggerNotification(
        {
          id: IDS[i],
          title: "Today's puzzle is ready",
          body: 'A new Arrow Flow daily challenge is waiting. Keep your streak going.',
          android: { channelId, pressAction: { id: 'default' } },
        },
        { type: TriggerType.TIMESTAMP, timestamp: date.getTime() },
      ),
    ),
  );
  return plan.length;
}
