-- AlterTable
ALTER TABLE "Dept" ALTER COLUMN "sort" SET DEFAULT 10;

-- CreateTable
CREATE TABLE "DeptCodeCounter" (
    "scope" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DeptCodeCounter_pkey" PRIMARY KEY ("scope")
);

-- AddForeignKey
ALTER TABLE "Dept" ADD CONSTRAINT "Dept_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Dept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
