import notifee from '@notifee/react-native';
import { planReminders } from '../../domain/reminder';
import { DEFAULT_SETTINGS, parseSettings } from '../../domain/settings';
import { ensureReminderPermission, syncReminders } from '../reminder';

const N = notifee as jest.Mocked<typeof notifee>;
const denied = { authorizationStatus: 0 } as never;
const at = (iso: string) => new Date(iso);

describe('reminder plan', () => {
  // Local times; the test runs in whatever zone the machine uses, so build dates locally.
  const now = new Date(2026, 10, 1, 10, 0); // 1 Nov, 10:00 local

  it('plans a week ahead at the chosen time', () => {
    const plan = planReminders(now, 'evening', {});
    expect(plan).toHaveLength(7);
    expect(plan[0]).toEqual(new Date(2026, 10, 1, 19, 0));
    expect(plan[6]).toEqual(new Date(2026, 10, 7, 19, 0));
  });

  it('starts tomorrow once today’s time has passed', () => {
    expect(planReminders(now, 'morning', {})[0]).toEqual(new Date(2026, 10, 2, 9, 0));
  });

  it('skips days whose daily is already cleared', () => {
    const first = planReminders(now, 'evening', {})[0];
    const clearedToday = { [first.toISOString().slice(0, 10)]: { score: 1, stars: 1 } };
    const plan = planReminders(now, 'evening', clearedToday);
    expect(plan[0]).toEqual(new Date(2026, 10, 2, 19, 0));
    expect(plan).toHaveLength(7);
  });
});

describe('reminder service', () => {
  beforeEach(() => jest.clearAllMocks());

  it('replaces the schedule with the plan', async () => {
    const count = await syncReminders(true, 'night', {}, at('2026-11-01T08:00:00Z'));
    expect(count).toBe(7);
    expect(N.cancelTriggerNotifications).toHaveBeenCalledWith(
      Array.from({ length: 7 }, (_, i) => `daily-reminder-${i}`),
    );
    expect(N.createTriggerNotification).toHaveBeenCalledTimes(7);
    const [notification, trigger] = N.createTriggerNotification.mock.calls[0];
    expect(notification).toMatchObject({
      id: 'daily-reminder-0',
      title: "Today's puzzle is ready",
      android: { channelId: 'daily-reminder' },
    });
    expect(trigger).toMatchObject({ type: 0 });
  });

  it('only cancels when turned off or not permitted', async () => {
    expect(await syncReminders(false, 'night', {})).toBe(0);
    N.getNotificationSettings.mockResolvedValueOnce(denied);
    expect(await syncReminders(true, 'night', {})).toBe(0);
    expect(N.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('asks only when not already allowed, and reports a refusal', async () => {
    expect(await ensureReminderPermission()).toBe(true);
    expect(N.requestPermission).not.toHaveBeenCalled();
    N.getNotificationSettings.mockResolvedValueOnce(denied);
    N.requestPermission.mockResolvedValueOnce(denied);
    expect(await ensureReminderPermission()).toBe(false);
  });
});

describe('reminder settings', () => {
  it('defaults off and loads older saves', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ reminder: false, reminderTime: 'evening' });
    expect(parseSettings('{"sound":true}')).toMatchObject({ reminder: false, reminderTime: 'evening' });
    expect(parseSettings('{"reminder":true,"reminderTime":"noon"}')).toMatchObject({
      reminder: true,
      reminderTime: 'noon',
    });
    expect(parseSettings('{"reminderTime":"3am"}').reminderTime).toBe('evening');
  });
});
