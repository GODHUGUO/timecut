-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "currentPlan" TEXT NOT NULL DEFAULT 'free',
    "monthlyMinutesUsed" INTEGER NOT NULL DEFAULT 0,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");
