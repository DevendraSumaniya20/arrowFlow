-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "nickname" VARCHAR(16) NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_results" (
    "player_id" UUID NOT NULL,
    "date" CHAR(10) NOT NULL,
    "score" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "moves" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_results_pkey" PRIMARY KEY ("player_id","date")
);

-- CreateTable
CREATE TABLE "level_results" (
    "player_id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "stars" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "moves" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_results_pkey" PRIMARY KEY ("player_id","level")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_token_hash_key" ON "players"("token_hash");

-- CreateIndex
CREATE INDEX "daily_results_date_score_duration_ms_idx" ON "daily_results"("date", "score" DESC, "duration_ms");

-- AddForeignKey
ALTER TABLE "daily_results" ADD CONSTRAINT "daily_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_results" ADD CONSTRAINT "level_results_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
