-- CreateEnum
CREATE TYPE "QuoteNotificationEvent" AS ENUM (
    'QUOTE_CREATED',
    'QUOTE_VIEWED',
    'QUOTE_DOWNLOADED',
    'QUOTE_IN_PROGRESS',
    'QUOTE_QUOTED',
    'QUOTE_REJECTED',
    'QUOTE_INVOICED'
);

-- CreateEnum
CREATE TYPE "NotificationScope" AS ENUM ('GLOBAL', 'OWN_BRANCH');

-- CreateEnum
CREATE TYPE "WhatsappNotificationTemplate" AS ENUM (
    'QUOTE_WEB_NOTIFICATION',
    'QUOTE_WEB_NOTIFICATION_ICONS',
    'QUOTE_WORKFLOW_MANAGER_NEW',
    'QUOTE_WORKFLOW_MANAGER_VIEWED',
    'QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD',
    'QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP',
    'QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP'
);

-- CreateTable
CREATE TABLE "UserNotificationSetting" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "event" "QuoteNotificationEvent" NOT NULL,
    "channel" "Channel" NOT NULL DEFAULT 'WHATSAPP',
    "template" "WhatsappNotificationTemplate" NOT NULL DEFAULT 'QUOTE_WEB_NOTIFICATION_ICONS',
    "scope" "NotificationScope" NOT NULL DEFAULT 'GLOBAL',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSetting_userId_event_channel_key" ON "UserNotificationSetting"("userId", "event", "channel");

-- CreateIndex
CREATE INDEX "UserNotificationSetting_event_channel_enabled_idx" ON "UserNotificationSetting"("event", "channel", "enabled");

-- AddForeignKey
ALTER TABLE "UserNotificationSetting" ADD CONSTRAINT "UserNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
