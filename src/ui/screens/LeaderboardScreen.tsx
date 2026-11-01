import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePlayer } from '../../store/hooks';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api, ApiError, Board, Entry } from '../../data/api';
import { utcDate } from '../../domain/daily';
import { Button } from '../components/Button';
import { Stars } from '../components/Icons';
import { ScoreArrow } from '../components/ScoreArrow';
import { SegmentedControl } from '../components/SegmentedControl';
import { ScreenHeader } from '../components/ScreenHeader';
import { useToday } from '../hooks/useToday';
import { Palette, rounded, type, usePalette, useStyles } from '../theme';

export type LeaderboardTab = 'today' | 'all';

interface Props {
  initialTab?: LeaderboardTab;
  onBack: () => void;
  onPlayDaily: (date: string) => void;
}

// Mirrors the server rule so most mistakes are caught before a round trip.
const NICKNAME = /^[\p{L}\p{N}_ .-]{3,16}$/u;

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; board: Board };

function timeLeft(now: Date) {
  const end = new Date(`${utcDate(now)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const mins = Math.max(0, Math.round((end.getTime() - now.getTime()) / 60000));
  return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
}

export function LeaderboardScreen({ initialTab = 'today', onBack, onPlayDaily }: Props) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
  const { player } = usePlayer();
  const [tab, setTab] = useState<LeaderboardTab>(initialTab);
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [refreshing, setRefreshing] = useState(false);
  const { today, now } = useToday();
  const token = player?.token;
  const latest = useRef(0);

  const fetchBoard = useCallback(async () => {
    // Only the newest request may update the screen (tabs can switch mid-flight).
    const id = ++latest.current;
    try {
      const board = tab === 'today' ? await api.dailyBoard(today, token) : await api.globalBoard(token);
      if (id === latest.current) {
        setLoad({ state: 'ready', board });
      }
    } catch (e) {
      if (id !== latest.current) {
        return;
      }
      setLoad({
        state: 'error',
        message:
          e instanceof ApiError && e.status === 0
            ? "Can't reach the leaderboard. Check your connection and try again."
            : 'The leaderboard is having trouble right now. Try again in a moment.',
      });
    }
  }, [tab, today, token]);

  useEffect(() => {
    setLoad({ state: 'loading' });
    fetchBoard();
  }, [fetchBoard]);

  const refresh = async () => {
    setRefreshing(true);
    await fetchBoard();
    setRefreshing(false);
  };

  const board = load.state === 'ready' ? load.board : null;
  const top = board?.entries[0]?.score ?? 0;
  const meListed = !!board?.me && board.entries.some(e => e.playerId === board.me!.playerId);

  return (
    <View style={styles.root}>
      <ScreenHeader title="Leaderboard" onBack={onBack} backLabel="Home" large />

      <SegmentedControl
        testIDPrefix="tab"
        options={[
          ['today', 'Today'],
          ['all', 'All time'],
        ]}
        value={tab}
        onChange={setTab}
      />
      <Text style={styles.caption}>
        {tab === 'today'
          ? `Today's daily challenge · resets in ${timeLeft(now)}`
          : 'Best score on every campaign level, added up'}
      </Text>

      <Identity />

      {load.state === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={c.muted} />
        </View>
      )}

      {load.state === 'error' && (
        <View style={styles.center}>
          <Text style={styles.message}>{load.message}</Text>
          <Button label="Try again" variant="ghost" onPress={() => fetchBoard()} testID="retry-board" />
        </View>
      )}

      {board && board.entries.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {tab === 'today' ? 'No one has cleared today yet' : 'No scores yet'}
          </Text>
          <Text style={styles.message}>
            {tab === 'today'
              ? 'Clear the daily challenge and take the top spot.'
              : 'Clear campaign levels while joined to appear here.'}
          </Text>
          {tab === 'today' && (
            <Button label="Play today's challenge" onPress={() => onPlayDaily(today)} />
          )}
        </View>
      )}

      {board && board.entries.length > 0 && (
        <FlatList
          data={board.entries}
          keyExtractor={e => e.playerId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          ItemSeparatorComponent={Separator}
          renderItem={({ item, index }) => (
            <Row
              entry={item}
              top={top}
              mine={item.playerId === board.me?.playerId}
              tab={tab}
              first={index === 0}
              last={index === board.entries.length - 1}
            />
          )}
          ListFooterComponent={
            board.me && !meListed ? (
              <View style={styles.pinned}>
                <Text style={styles.sectionHeader}>YOUR RANK</Text>
                <Row entry={board.me} top={top} mine tab={tab} first last />
              </View>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

// Own tiny stylesheet: one is mounted per row, so it must not build the screen's styles.
const makeSeparatorStyles = (c: Palette) =>
  StyleSheet.create({
    wrap: { backgroundColor: c.surface },
    line: { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginLeft: 60 },
  });

function Separator() {
  const styles = useStyles(makeSeparatorStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.line} />
    </View>
  );
}

function Row({
  entry,
  top,
  mine,
  tab,
  first,
  last,
}: {
  entry: Entry;
  top: number;
  mine: boolean;
  tab: LeaderboardTab;
  first?: boolean;
  last?: boolean;
}) {
  const styles = useStyles(makeStyles);
  const c = usePalette();
  const detail = tab === 'all' && entry.levels !== undefined ? `${entry.levels} levels` : null;
  return (
    <View
      style={[styles.row, first && styles.rowFirst, last && styles.rowLast, mine && styles.rowMine]}
      testID={mine ? 'my-rank-row' : undefined}
      accessible
      accessibilityLabel={`Rank ${entry.rank}, ${entry.nickname}${mine ? ' (you)' : ''}, ${entry.score} points`}>
      <Text style={[styles.rank, entry.rank <= 3 && styles.rankTop]}>{entry.rank}</Text>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.name} numberOfLines={1}>
            {entry.nickname}
            {mine ? <Text style={styles.you}>  You</Text> : null}
          </Text>
          <Text style={styles.score}>{entry.score.toLocaleString()}</Text>
        </View>
        <View style={styles.rowBottom}>
          <ScoreArrow ratio={top ? entry.score / top : 0} width={150} color={mine ? c.accent : c.ink} />
          {detail ? (
            <Text style={styles.detail}>{detail}</Text>
          ) : (
            <View style={styles.starRow}>
              <Stars count={entry.stars} size={12} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** Join with a nickname, or show/change the current one. */
function Identity() {
  const styles = useStyles(makeStyles);
  const c = usePalette();
  const { player, expired, register, rename } = usePlayer();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (player && !editing) {
    return (
      <View style={styles.identity}>
        <Text style={styles.identityText}>
          Playing as <Text style={styles.identityName}>{player.nickname}</Text>
        </Text>
        <Pressable
          hitSlop={12}
          onPress={() => {
            setName(player.nickname);
            setEditing(true);
          }}
          accessibilityRole="button"
          testID="change-name">
          <Text style={styles.link}>Change</Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    const nickname = name.trim();
    if (!NICKNAME.test(nickname)) {
      setError('Use 3–16 letters, numbers, spaces, _ . or -');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await (player ? rename(nickname) : register(nickname));
      setEditing(false);
    } catch (e) {
      // register/rename reject with a plain { status, code } (status 0 = offline).
      setError(
        (e as { status?: number })?.status === 0
          ? "Can't reach the server. Try again when you're online."
          : 'That name was not accepted. Try another one.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.join}>
      <Text style={styles.joinTitle}>{player ? 'Change your name' : 'Join the leaderboard'}</Text>
      {!player && (
        <Text style={styles.joinMessage}>
          {expired
            ? 'Your leaderboard name is no longer recognised. Join again; your waiting results will be posted.'
            : 'Pick a name to rank your daily runs. No account needed; wins from this phone count.'}
        </Text>
      )}
      <View style={styles.joinRow}>
        <TextInput
          testID="nickname-input"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={c.muted}
          maxLength={16}
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={submit}
          style={styles.input}
          accessibilityLabel="Nickname"
        />
        <Button
          testID="join-button"
          label={busy ? '…' : player ? 'Save' : 'Join'}
          onPress={submit}
          disabled={busy}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      {player && (
        <Pressable onPress={() => setEditing(false)} hitSlop={12} accessibilityRole="button">
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 16 },
    caption: { color: c.muted, ...type.footnote, textAlign: 'center', marginTop: 10 },
    identity: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 44,
      marginTop: 12,
      marginBottom: 8,
      paddingHorizontal: 16,
      ...rounded(12),
      backgroundColor: c.surface,
    },
    identityText: { color: c.muted, ...type.body },
    identityName: { color: c.text, fontWeight: '600' },
    link: { color: c.accent, ...type.body },
    join: {
      marginTop: 12,
      marginBottom: 8,
      padding: 16,
      gap: 10,
      ...rounded(12),
      backgroundColor: c.surface,
    },
    joinTitle: { color: c.text, ...type.headline },
    joinRow: { flexDirection: 'row', gap: 10 },
    joinMessage: { color: c.muted, ...type.subhead, lineHeight: 20 },
    input: {
      flex: 1,
      minHeight: 50,
      ...rounded(10),
      paddingHorizontal: 12,
      ...type.body,
      color: c.text,
      backgroundColor: c.surfaceAlt,
    },
    error: { color: c.danger, ...type.footnote },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16 },
    emptyTitle: { color: c.text, ...type.title3, textAlign: 'center' },
    message: { color: c.muted, ...type.subhead, lineHeight: 20, textAlign: 'center' },
    list: { paddingTop: 8, paddingBottom: 24 },
    // Inset grouped list: rows share one rounded card, hairlines between them.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 60,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
    },
    rowFirst: rounded(12, 'top'),
    rowLast: rounded(12, 'bottom'),
    rowMine: { backgroundColor: c.accentSoft },
    rank: {
      width: 32,
      color: c.muted,
      ...type.headline,
      textAlign: 'center',
      fontVariant: ['tabular-nums'],
    },
    rankTop: { color: c.text },
    rowBody: { flex: 1, gap: 6 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
    name: { flex: 1, color: c.text, ...type.body },
    you: { color: c.accent, ...type.footnote, fontWeight: '600' },
    score: { color: c.text, ...type.headline, fontVariant: ['tabular-nums'] },
    rowBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    starRow: { flexDirection: 'row' },
    detail: { color: c.muted, ...type.caption, fontVariant: ['tabular-nums'] },
    pinned: { marginTop: 20 },
    sectionHeader: { color: c.muted, ...type.footnote, marginLeft: 16, marginBottom: 6 },
  });
