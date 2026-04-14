-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "keyIngredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "region" TEXT;
