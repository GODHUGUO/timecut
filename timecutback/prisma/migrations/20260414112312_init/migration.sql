-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "videoId" INTEGER NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
