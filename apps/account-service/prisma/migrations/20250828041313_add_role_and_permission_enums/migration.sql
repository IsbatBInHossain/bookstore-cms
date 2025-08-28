/*
  Warnings:

  - Changed the type of `action` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `subject` on the `permissions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `roles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."RoleName" AS ENUM ('CUSTOMER', 'ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "public"."PermissionAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "public"."PermissionSubject" AS ENUM ('BOOK', 'USER', 'ORDER');

-- AlterTable
ALTER TABLE "public"."permissions" DROP COLUMN "action",
ADD COLUMN     "action" "public"."PermissionAction" NOT NULL,
DROP COLUMN "subject",
ADD COLUMN     "subject" "public"."PermissionSubject" NOT NULL;

-- AlterTable
ALTER TABLE "public"."roles" DROP COLUMN "name",
ADD COLUMN     "name" "public"."RoleName" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_subject_key" ON "public"."permissions"("action", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");
