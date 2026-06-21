-- Bảng NewsletterSubscriber — chạy thủ công trong Supabase SQL Editor
-- (dùng khi `prisma db push` không kết nối được qua pooler)

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id"               TEXT NOT NULL,
  "email"            TEXT NOT NULL,
  "isActive"         BOOLEAN NOT NULL DEFAULT true,
  "source"           TEXT,
  "unsubscribeToken" TEXT NOT NULL,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unsubscribedAt"   TIMESTAMP(3),
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key"
  ON "NewsletterSubscriber"("email");

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_unsubscribeToken_key"
  ON "NewsletterSubscriber"("unsubscribeToken");

CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_isActive_idx"
  ON "NewsletterSubscriber"("isActive");
