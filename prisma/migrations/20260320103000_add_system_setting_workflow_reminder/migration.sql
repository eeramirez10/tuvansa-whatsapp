-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "valueBoolean" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- Seed default value for in-progress manager notification feature
INSERT INTO "SystemSetting" ("key", "valueBoolean", "updatedAt")
VALUES ('IN_PROGRESS_MANAGER_NOTIFICATION_ENABLED', true, CURRENT_TIMESTAMP);
