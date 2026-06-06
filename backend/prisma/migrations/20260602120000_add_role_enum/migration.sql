-- CreateEnum
DO $$
BEGIN
	CREATE TYPE "Role" AS ENUM ('VOTER', 'ADMIN');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

-- Normalize existing values (safety for legacy data)
UPDATE "User"
SET "role" = 'VOTER'
WHERE "role" IS NULL OR "role" NOT IN ('VOTER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VOTER';
