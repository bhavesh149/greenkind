import {
  DrawMode,
  DrawStatus,
  PayoutStatus,
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
  WinnerVerificationStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const seedPassword = 'TestPassword123!';

async function main() {
  const passwordHash = await argon2.hash(seedPassword);
  const charityNames = [
    { name: 'Local Food Bank', slug: 'local-food-bank', category: 'Hunger' },
    { name: 'Youth Sports Fund', slug: 'youth-sports-fund', category: 'Youth' },
    {
      name: 'Clean Water Initiative',
      slug: 'clean-water-initiative',
      category: 'Environment',
    },
    {
      name: "Veterans' Support",
      slug: 'veterans-support',
      category: 'Veterans',
    },
    {
      name: 'Housing First Co-op',
      slug: 'housing-first-coop',
      category: 'Housing',
    },
    {
      name: 'Education Scholarships',
      slug: 'education-scholarships',
      category: 'Education',
    },
    {
      name: 'Mental Health Alliance',
      slug: 'mental-health-alliance',
      category: 'Health',
    },
    {
      name: 'Community Arts Collective',
      slug: 'community-arts',
      category: 'Arts',
    },
  ] as const;

  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenkind.test' },
    create: {
      email: 'admin@greenkind.test',
      passwordHash,
      name: 'GreenKind Admin',
      role: UserRole.ADMIN,
      charityContribution: 10,
    },
    update: { passwordHash, name: 'GreenKind Admin' },
  });

  const charities = [];
  for (const c of charityNames) {
    const ch = await prisma.charity.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        description: `Supporting ${c.category.toLowerCase()} in our communities.`,
        category: c.category,
        featured:
          c.slug === 'local-food-bank' || c.slug === 'clean-water-initiative',
        createdById: admin.id,
      },
      update: { name: c.name, createdById: admin.id },
    });
    charities.push(ch);
  }

  const [firstCharity, secondCharity] = charities;

  const sub1 = await prisma.user.upsert({
    where: { email: 'subscriber1@greenkind.test' },
    create: {
      email: 'subscriber1@greenkind.test',
      passwordHash,
      name: 'Alex Golfer',
      role: UserRole.SUBSCRIBER,
      selectedCharityId: firstCharity.id,
      charityContribution: 12,
    },
    update: {
      passwordHash,
      name: 'Alex Golfer',
      selectedCharityId: firstCharity.id,
    },
  });

  const sub2 = await prisma.user.upsert({
    where: { email: 'subscriber2@greenkind.test' },
    create: {
      email: 'subscriber2@greenkind.test',
      passwordHash,
      name: 'Sam Fairway',
      role: UserRole.SUBSCRIBER,
      selectedCharityId: secondCharity.id,
      charityContribution: 10,
    },
    update: {
      passwordHash,
      name: 'Sam Fairway',
      selectedCharityId: secondCharity.id,
    },
  });

  await prisma.subscription.upsert({
    where: { userId: sub1.id },
    create: {
      userId: sub1.id,
      plan: SubscriptionPlan.MONTHLY,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_seed_sub1',
      stripeSubscriptionId: 'sub_seed_sub1',
      currentPeriodStart: new Date('2024-01-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-12-31T23:59:59.000Z'),
      lastPaymentAt: new Date('2024-12-15T10:00:00.000Z'),
      nextBillingAt: new Date('2025-01-15T10:00:00.000Z'),
    },
    update: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  await prisma.subscription.upsert({
    where: { userId: sub2.id },
    create: {
      userId: sub2.id,
      plan: SubscriptionPlan.YEARLY,
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: 'cus_seed_sub2',
      stripeSubscriptionId: 'sub_seed_sub2',
      currentPeriodStart: new Date('2024-06-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2025-05-31T23:59:59.000Z'),
    },
    update: { status: SubscriptionStatus.ACTIVE },
  });

  const scoreDays = [0, 3, 7, 14, 21].map((d) => {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0);
    t.setUTCDate(t.getUTCDate() - d);
    return t;
  });
  for (const day of scoreDays) {
    const dateOnly = new Date(
      Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    await prisma.score.upsert({
      where: {
        userId_scoreDate: { userId: sub1.id, scoreDate: dateOnly },
      },
      create: {
        userId: sub1.id,
        scoreDate: dateOnly,
        scoreValue: 22 + (day.getUTCDate() % 10),
      },
      update: { scoreValue: 22 + (day.getUTCDate() % 10) },
    });
  }

  const drawMonth = new Date(Date.UTC(2024, 11, 1));
  const draw = await prisma.draw.upsert({
    where: { month: drawMonth },
    create: {
      month: drawMonth,
      mode: DrawMode.RANDOM,
      status: DrawStatus.PUBLISHED,
      generatedNumbers: [3, 7, 12, 19, 25],
      seed: 'seed:demo-2024-12',
      resultSummary: {
        note: 'Demo draw for development',
        matchTiers: { tier5: 1, tier4: 0, tier3: 2 },
      },
      publishedAt: new Date('2024-12-05T18:00:00.000Z'),
    },
    update: { status: DrawStatus.PUBLISHED },
  });

  await prisma.winner.upsert({
    where: {
      drawId_userId_tier: {
        drawId: draw.id,
        userId: sub1.id,
        tier: 5,
      },
    },
    create: {
      drawId: draw.id,
      userId: sub1.id,
      tier: 5,
      matchCount: 5,
      payoutAmountCents: 1_200_000,
      verificationStatus: WinnerVerificationStatus.PENDING,
      payoutStatus: PayoutStatus.PENDING,
    },
    update: { payoutAmountCents: 1_200_000 },
  });

  const ledgerMonth = new Date(Date.UTC(2024, 11, 1));
  await prisma.prizePoolLedger.upsert({
    where: { month: ledgerMonth },
    create: {
      month: ledgerMonth,
      activeSubscribers: 120,
      totalRevenueCents: 180_000,
      poolCents: 36_000,
      tier5Cents: 14_400,
      tier4Cents: 12_600,
      tier3Cents: 9_000,
      rolloverInCents: 2_000,
      rolloverOutCents: 0,
    },
    update: { activeSubscribers: 120 },
  });

  const existingNote = await prisma.notification.findFirst({
    where: { userId: sub1.id, type: 'draw.published' },
  });
  if (!existingNote) {
    await prisma.notification.create({
      data: {
        userId: sub1.id,
        type: 'draw.published',
        title: 'December draw is live',
        body: 'Results are in — check your match tier.',
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed done. Test logins:');
  // eslint-disable-next-line no-console
  console.log('  admin@greenkind.test / ' + seedPassword);
  // eslint-disable-next-line no-console
  console.log(
    '  subscriber1@greenkind.test, subscriber2@greenkind.test / ' +
      seedPassword,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
