-- CreateTable
CREATE TABLE "scheduled_tasks" (
    "id" SERIAL NOT NULL,
    "task_name" TEXT NOT NULL,
    "queue_name" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- Seed: переносим текущие крон-задачи из appConfig.js, чтобы поведение системы не изменилось
INSERT INTO "scheduled_tasks" ("task_name", "queue_name", "job_type", "cron_expression", "is_active", "payload", "updated_at") VALUES
(
    'Ежедневный парсинг Roborock',
    'scraping',
    'trigger-scheduled-task',
    '0 10 * * *',
    true,
    '{"query":"Roborock S8 Pro+","marketplace":"Kaspi","maxItems":3,"searchType":"query"}',
    CURRENT_TIMESTAMP
),
(
    'Синхронизация телефонов продавцов',
    'seller',
    'sync-seller-phones',
    '0 /2 * * *',
    true,
    '{}',
    CURRENT_TIMESTAMP
);
