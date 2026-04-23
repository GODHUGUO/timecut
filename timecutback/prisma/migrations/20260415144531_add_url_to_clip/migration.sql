/*
  Warnings:

  - You are about to drop the column `path` on the `Clip` table. All the data in the column will be lost.
  - Added the required column `url` to the `Clip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Clip" DROP COLUMN "path",
ADD COLUMN     "url" TEXT NOT NULL;
