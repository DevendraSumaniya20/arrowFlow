# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

Casual players on short breaks: a commute, a queue, a few minutes between tasks. Sessions last 2-5 minutes. They want a calm puzzle, a small daily habit, and light, optional competition with friends and strangers.

## Product Purpose

Arrow Flow is an arrow-escape logic puzzle. The player taps bent arrows in the right order so each one slides off the board along its own path; tapping a blocked arrow costs a heart. Success is a player who returns daily for the challenge and keeps progressing through the endless campaign.

## Positioning

Every board is generated on the device from a seed and is guaranteed solvable, so levels never run out. Leaderboard results are verified by the server, which replays the player's moves on the same seeded board. Scores cannot be typed in.

## Operating Context

- One-handed play in short sessions, often with sound off or other audio playing.
- The daily challenge is the same board worldwide, rolls over at 00:00 UTC, and gets harder from Monday to Sunday.
- Players stay anonymous with a nickname; there are no accounts or sign-in.
- Wins made offline are queued and submitted later.

## Capabilities and Constraints

- React Native 0.88 app for iOS and Android, plus a Node (Fastify + Postgres) backend in `server/`.
- One custom game identity on both platforms. Only system pieces (sheets, alerts, switches, haptics) follow each OS.
- Campaign: endless seeded levels, 3 hearts, 2 hints per level, combo scoring, 1-3 stars, progress saved on device.
- Daily challenge, a Today leaderboard, and an All-time leaderboard (sum of best level scores).
- Synthesized sound effects and haptics, both switchable in Settings.
- Undecided: production API host, social features (friends, sharing).

## Brand Commitments

- Name: "Arrow Flow" (repository: arrowFlow).

## Evidence on Hand

No player counts, ratings, testimonials or press exist. Do not invent any.

## Product Principles

1. Calm first. Competition is an invitation, never pressure.
2. Every board is fair: solvable, deterministic, and the same for everyone on a given day.
3. A session must fit in a short break: no long setup, no forced sign-in.
4. Never lose a player's progress or result, even offline.
