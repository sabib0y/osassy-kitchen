-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryCity" TEXT,
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "deliveryPhone" TEXT,
ADD COLUMN     "deliveryPostcode" TEXT,
ADD COLUMN     "preferredDeliveryDay" TEXT,
ADD COLUMN     "preferredDeliveryTimeSlot" TEXT;
