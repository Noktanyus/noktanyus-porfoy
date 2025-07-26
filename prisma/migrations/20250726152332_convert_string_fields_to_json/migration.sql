/*
  Warnings:

  - The `tags` column on the `Blog` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `replies` column on the `Message` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `buttons` column on the `Popup` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `technologies` column on the `Project` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "tags",
ADD COLUMN     "tags" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "replies",
ADD COLUMN     "replies" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Popup" DROP COLUMN "buttons",
ADD COLUMN     "buttons" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "technologies",
ADD COLUMN     "technologies" JSONB NOT NULL DEFAULT '[]';
