-- Passe le suivi du quota en minutes fractionnaires (comptage à la seconde près).
-- Les valeurs entières existantes restent valides (ex: 3 -> 3.0).
-- AlterTable
ALTER TABLE "UserSubscription"
  ALTER COLUMN "monthlyMinutesUsed" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "carryOverMinutes" SET DATA TYPE DOUBLE PRECISION;
