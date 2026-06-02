-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPANY', 'CANDIDATE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ACTIVE', 'CLOSED', 'DRAFT');

-- CreateEnum
CREATE TYPE "AppStatus" AS ENUM ('APPLIED', 'REVIEWING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "googleAuth" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skills" TEXT,
    "experience" TEXT,
    "education" TEXT,
    "resumeUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "salary" TEXT,
    "type" "JobType" NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'ACTIVE',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeUrl" TEXT NOT NULL,
    "coverLetter" TEXT,
    "aiScore" INTEGER,
    "status" "AppStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookmarkedJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookmarkedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Company_userId_key" ON "Company"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_userId_key" ON "CandidateProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_jobId_candidateId_key" ON "Application"("jobId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "BookmarkedJob_userId_jobId_key" ON "BookmarkedJob"("userId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkedJob" ADD CONSTRAINT "BookmarkedJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookmarkedJob" ADD CONSTRAINT "BookmarkedJob_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
