# arrowFlow

**Arrow Flow**: an arrow-escape puzzle for Android and iOS (React Native 0.88, TypeScript),
with a Node backend for the daily challenge and leaderboards.
Tap a bent arrow: if the lane in front of its head is clear it slides off the
board like a snake, otherwise it bumps and you lose a heart. Clear the board.

- Endless levels, generated on device from the level number (seeded RNG)
- 3 hearts, 2 free hints per level, combo scoring, 1-3 stars
- Synthesized sound effects and haptics, both switchable in Settings
- Progress and settings saved on the phone (AsyncStorage)
- Daily challenge: one seeded board per UTC day, harder Monday to Sunday
- Leaderboards (Today / All time) with anonymous nicknames; results are
  verified by the server, which replays the moves on the same seeded board
- Light and dark appearance

## Run

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npm start            # Metro
npm run android      # emulator / device
npm run ios          # simulator
```

## Backend (`server/`)

Fastify 5 + Prisma 7 + PostgreSQL. It imports the app's game engine
(`src/domain`, `src/state/gameReducer.ts`), so the server rebuilds any board
and replays a player's moves exactly like the phone: clients never send a score.

```sh
cd server
npm install
cp .env.example .env        # set DATABASE_URL
npx prisma migrate dev      # create tables
npm run dev                 # http://localhost:3000
npm test                    # integration tests (needs a database named arrowflow_test)
```

The app calls `http://10.0.2.2:3000` (Android emulator) or `http://localhost:3000`
(iOS simulator) in debug builds. Set the production URL in `src/config.ts`.
With Docker: `docker compose -f server/docker-compose.yml up --build`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/v1/players` | - | Register a nickname, returns the player token once |
| GET/PATCH | `/v1/players/me` | Bearer | Read or rename the player |
| GET | `/v1/daily` | - | Today's date (UTC), difficulty, end time |
| POST | `/v1/daily/:date/results` | Bearer | Submit moves; server verifies, keeps best, returns rank |
| GET | `/v1/daily/:date/leaderboard` | optional | Top 50 + your own rank |
| POST | `/v1/levels/:level/results` | Bearer | Submit a verified campaign level run |
| GET | `/v1/leaderboard` | optional | All-time: sum of best level scores |
| GET | `/health` | - | Liveness + database check |

Wins made offline (or before joining) wait in an on-device outbox and are sent later.

## Test

```sh
npm test             # Jest: rules, generator, reducer, progress, app render
npm run e2e:android  # Maestro flows in .maestro/ (app installed, Metro and API running)
npm run e2e:ios      # add --device <udid> if several devices are connected
```

## Architecture

```
src/
  domain/   pure TypeScript, no React Native: the game itself
    types.ts       Arrow (cells head-first + direction), Level
    board.ts       lanes, blockers, free arrows, solve depth
    generator.ts   seeded level builder (same level = same board everywhere)
    scoring.ts     lives, hints, combo points, stars
    progress.ts    saved-progress model, merge + validation
    settings.ts    settings model + validation
    daily.ts       daily challenge seed and difficulty
server/     Fastify API, Prisma schema + migrations, integration tests
  data/     storage.ts (AsyncStorage), api.ts (typed backend client)
  state/    gameReducer.ts (all game rules as actions), feedback.ts (which
            sound/haptic each transition causes), Progress/Settings contexts
  services/ sound.ts (synthesized effects), results.ts (offline outbox)
  ui/       screens/ (Home, LevelSelect, Game, Settings), components/, hooks/
```

Dependencies only point inward: `ui -> state/services -> domain`, `data -> domain`.

### How levels are made

Levels are endless and generated on device from the level number. Arrows are
placed in reverse solve order: each new arrow needs a clear exit lane past the
arrows already placed, so every board is solvable and can never deadlock.
Placement prefers spots that block the newest arrows' lanes, which builds long
dependency chains. Several candidate boards are built per level and the one with
the deepest solve chain and fewest free opening moves wins. Boards grow from 6x6
to 16x16.
