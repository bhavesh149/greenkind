-- Unique when set (Postgres allows multiple NULLs for unique optional columns in Prisma unique)
CREATE UNIQUE INDEX IF NOT EXISTS "donations_stripe_payment_intent_id_key" ON "donations" ("stripe_payment_intent_id");
