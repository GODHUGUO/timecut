-- CreateTable
CREATE TABLE "UserPreference" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "subtitleTranslationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "targetSubtitleLanguage" TEXT NOT NULL DEFAULT 'fr',
    "captionStyle" TEXT NOT NULL DEFAULT 'bold',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
