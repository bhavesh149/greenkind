process.env.NODE_ENV = 'test';
process.env.SKIP_REDIS = '1';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/greenkind';
process.env.FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001';
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? 'e2e-jwt-access-secret-min-32-chars-ok';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'e2e-jwt-refresh-secret-min-32-chars!';
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY ??
  'sk_test_e2e_placeholder_32_characters_min_!!';
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ??
  'whsec_e2e_placeholder_32_characters_min_!!';
process.env.STRIPE_PRICE_ID_MONTHLY =
  process.env.STRIPE_PRICE_ID_MONTHLY ?? 'price_e2e_monthly';
process.env.STRIPE_PRICE_ID_YEARLY =
  process.env.STRIPE_PRICE_ID_YEARLY ?? 'price_e2e_yearly';
