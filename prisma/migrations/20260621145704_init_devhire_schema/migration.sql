/*
  Warnings:

  - The values [APPLIED,REVIEWING,ACCEPTED,REJECTED] on the enum `AppStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [REMOTE] on the enum `JobType` will be removed. If these variants are still used in the database, this will fail.
  - The `skills` column on the `CandidateProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `experience` column on the `CandidateProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `education` column on the `CandidateProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `companyName` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `salary` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `viewCount` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `googleAuth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Company` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppStatus_new" AS ENUM ('Applied', 'Reviewing', 'Accepted', 'Rejected');
ALTER TABLE "public"."Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application" ALTER COLUMN "status" TYPE "AppStatus_new" USING ("status"::text::"AppStatus_new");
ALTER TYPE "AppStatus" RENAME TO "AppStatus_old";
ALTER TYPE "AppStatus_new" RENAME TO "AppStatus";
DROP TYPE "public"."AppStatus_old";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'Applied';
COMMIT;

-- AlterEnum
ALTER TYPE "JobStatus" ADD VALUE 'PAUSED';

-- AlterEnum
BEGIN;
CREATE TYPE "JobType_new" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');
ALTER TABLE "Job" ALTER COLUMN "jobType" TYPE "JobType_new" USING ("jobType"::text::"JobType_new");
ALTER TYPE "JobType" RENAME TO "JobType_old";
ALTER TYPE "JobType_new" RENAME TO "JobType";
DROP TYPE "public"."JobType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'Applied';

-- AlterTable
ALTER TABLE "CandidateProfile" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "resumeFileName" TEXT,
DROP COLUMN "skills",
ADD COLUMN     "skills" TEXT[],
DROP COLUMN "experience",
ADD COLUMN     "experience" JSONB,
DROP COLUMN "education",
ADD COLUMN     "education" JSONB;

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "companyName",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "size" TEXT,
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "salary",
DROP COLUMN "type",
DROP COLUMN "viewCount",
ADD COLUMN     "experienceLevel" TEXT,
ADD COLUMN     "jobType" "JobType",
ADD COLUMN     "salaryRange" TEXT,
ALTER COLUMN "requirements" DROP NOT NULL,
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "deadline" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleAuth",
DROP COLUMN "name",
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
