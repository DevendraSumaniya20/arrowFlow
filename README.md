# arrowFlow

**ArrowSwap**: an arrow-escape puzzle for Android and iOS (React Native 0.88, TypeScript).
Tap a bent arrow: if the lane in front of its head is clear it slides off the
board like a snake, otherwise it bumps and you lose a heart. Clear the board.

- Endless levels, generated on device from the level number (seeded RNG)
- 3 hearts, 2 free hints per level, combo scoring, 1-3 stars
- Synthesized sound effects and haptics, both switchable in Settings
- Progress and settings saved on the phone (AsyncStorage)

## Run

```sh
npm install
cd ios && bundle install && bundle exec pod install && cd ..
npm start            # Metro
npm run android      # emulator / device
npm run ios          # simulator
```

## Test

```sh
npm test             # Jest: rules, generator, reducer, progress, app render
npm run e2e:android  # Maestro flows in .maestro/ (app installed + Metro running)
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
  data/     storage.ts: AsyncStorage persistence for progress and settings
  state/    gameReducer.ts (all game rules as actions), feedback.ts (which
            sound/haptic each transition causes), Progress/Settings contexts
  services/ sound.ts: effects synthesized with react-native-audio-api
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
