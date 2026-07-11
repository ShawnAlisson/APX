import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { computeAllMetrics, getWinningOptionId } from "@/lib/battle-score";
import type {
  BattleDashboard,
  BattleMetrics,
  BattleOption,
  BattleRecord,
  BattleStatus,
  BreakEvenResult,
  BusinessRecord,
  CommitmentLevel,
  PublicBattle,
  PublicBusiness,
  ResponseRecord,
  Verdict,
  WaitlistRecord,
} from "@/lib/battle-types";

const BUSINESS_COLLECTION = "businesses";
const BATTLE_COLLECTION = "battles";
const RESPONSE_COLLECTION = "responses";
const WAITLIST_COLLECTION = "waitlist";

const indexesPromise = new Map<string, Promise<void>>();

const SHORT_CODE_CHARS = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateShortCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureIndexes() {
  if (!indexesPromise.has("battles")) {
    indexesPromise.set(
      "battles",
      (async () => {
        const db = await getDb();
        await Promise.all([
          db.collection<BusinessRecord>(BUSINESS_COLLECTION).createIndex({ slug: 1 }, { unique: true }),
          db.collection<BusinessRecord>(BUSINESS_COLLECTION).createIndex({ ownerId: 1 }),
          db.collection<BattleRecord>(BATTLE_COLLECTION).createIndex({ shortCode: 1 }, { unique: true }),
          db.collection<BattleRecord>(BATTLE_COLLECTION).createIndex({ ownerId: 1 }),
          db.collection<BattleRecord>(BATTLE_COLLECTION).createIndex({ businessId: 1 }),
          db.collection<ResponseRecord>(RESPONSE_COLLECTION).createIndex({ battleId: 1 }),
          db.collection<ResponseRecord>(RESPONSE_COLLECTION).createIndex({ sessionToken: 1 }),
          db.collection<WaitlistRecord>(WAITLIST_COLLECTION).createIndex({ email: 1 }),
        ]);
      })(),
    );
  }
  await indexesPromise.get("battles");
}

function toPublicBusiness(record: BusinessRecord): PublicBusiness {
  return {
    id: record._id.toString(),
    name: record.name,
    slug: record.slug,
    googleReviewUrl: record.googleReviewUrl,
  };
}

function toPublicBattle(record: BattleRecord, business?: PublicBusiness): PublicBattle {
  return {
    id: record._id.toString(),
    shortCode: record.shortCode,
    status: record.status,
    question: record.question,
    deadline: record.deadline.toISOString(),
    serviceDate: record.serviceDate,
    serviceWindow: record.serviceWindow,
    maxCapacity: record.maxCapacity,
    minBookings: record.minBookings,
    additionalCosts: record.additionalCosts,
    foodCostPct: record.foodCostPct,
    staffingCost: record.staffingCost,
    wastageAllowance: record.wastageAllowance,
    options: record.options,
    winnerOptionId: record.winnerOptionId,
    unlockThreshold: record.unlockThreshold,
    unlockBonus: record.unlockBonus,
    business,
  };
}

export function computeBreakEven(
  battle: PublicBattle,
  metrics: BattleMetrics[],
): BreakEvenResult {
  const leading = [...metrics].sort(
    (a, b) => b.deposited + b.reserved - (a.deposited + a.reserved),
  )[0];
  const leadingOption = battle.options.find((o) => o.id === leading?.optionId);
  const price = leadingOption?.price ?? battle.options[0]?.price ?? 0;

  const totalDeposits = metrics.reduce((sum, m) => sum + m.deposited, 0);
  const totalReserved = metrics.reduce((sum, m) => sum + m.reserved, 0);
  const conversionRate = 0.85;

  const expectedRevenue =
    totalDeposits * price + totalReserved * price * conversionRate;
  const foodCost = expectedRevenue * (battle.foodCostPct / 100);
  const totalCost =
    foodCost + battle.staffingCost + battle.additionalCosts + battle.wastageAllowance;
  const profit = expectedRevenue - totalCost;

  const marginPerHead = price * (1 - battle.foodCostPct / 100);
  const fixedCosts = battle.staffingCost + battle.additionalCosts + battle.wastageAllowance;
  const bookingsNeeded =
    marginPerHead > 0 ? Math.ceil(fixedCosts / marginPerHead) : battle.minBookings;

  return {
    expectedRevenue: Math.round(expectedRevenue * 100) / 100,
    foodCost: Math.round(foodCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    bookingsNeeded,
    leadingOptionId: leading?.optionId ?? null,
    leadingBookings: (leading?.deposited ?? 0) + (leading?.reserved ?? 0),
  };
}

export function computeVerdict(
  battle: PublicBattle,
  metrics: BattleMetrics[],
  breakEven: BreakEvenResult,
): { verdict: Verdict; rationale: string } {
  const leading = metrics.find((m) => m.optionId === breakEven.leadingOptionId);
  const leadingBookings = (leading?.deposited ?? 0) + (leading?.reserved ?? 0);
  const totalVotes = metrics.reduce((sum, m) => sum + m.votes, 0);
  const totalDeposits = metrics.reduce((sum, m) => sum + m.deposited, 0);

  if (leadingBookings >= battle.minBookings && leadingBookings >= breakEven.bookingsNeeded) {
    return {
      verdict: "proceed",
      rationale: `Leading team has ${leadingBookings} bookings — above the ${battle.minBookings} minimum and break-even threshold.`,
    };
  }

  if (totalVotes >= battle.minBookings && totalDeposits < battle.minBookings * 0.3) {
    return {
      verdict: "modify",
      rationale: "Strong interest but low deposit conversion — consider lowering price or deposit amount.",
    };
  }

  if (leading && leading.votes > leading.deposited * 3) {
    return {
      verdict: "modify",
      rationale: "Votes outpace deposits — one team is popular but commitment is weak.",
    };
  }

  if (totalVotes < battle.minBookings * 0.5) {
    return {
      verdict: "cancel",
      rationale: `Only ${totalVotes} responses — well below the ${battle.minBookings} booking minimum.`,
    };
  }

  return {
    verdict: "modify",
    rationale: `${leadingBookings} bookings so far — close but not yet at break-even. Consider extending the deadline.`,
  };
}

export async function getOrCreateBusiness(ownerId: string, name: string, googleReviewUrl?: string) {
  await ensureIndexes();
  const db = await getDb();
  const existing = await db
    .collection<BusinessRecord>(BUSINESS_COLLECTION)
    .findOne({ ownerId });

  if (existing) {
    return toPublicBusiness(existing);
  }

  const baseSlug = slugify(name) || "business";
  let slug = baseSlug;
  let attempt = 0;
  while (await db.collection<BusinessRecord>(BUSINESS_COLLECTION).findOne({ slug })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  const record: BusinessRecord = {
    _id: new ObjectId(),
    ownerId,
    name,
    slug,
    googleReviewUrl,
    createdAt: new Date(),
  };

  await db.collection<BusinessRecord>(BUSINESS_COLLECTION).insertOne(record);
  return toPublicBusiness(record);
}

export async function updateBusiness(
  ownerId: string,
  input: { name?: string; googleReviewUrl?: string },
) {
  await ensureIndexes();
  const db = await getDb();
  const update: Partial<BusinessRecord> = {};
  if (input.name) update.name = input.name;
  if (input.googleReviewUrl !== undefined) update.googleReviewUrl = input.googleReviewUrl;

  await db.collection<BusinessRecord>(BUSINESS_COLLECTION).updateOne({ ownerId }, { $set: update });
  const record = await db.collection<BusinessRecord>(BUSINESS_COLLECTION).findOne({ ownerId });
  return record ? toPublicBusiness(record) : null;
}

export async function getBusinessByOwnerId(ownerId: string) {
  await ensureIndexes();
  const db = await getDb();
  const record = await db.collection<BusinessRecord>(BUSINESS_COLLECTION).findOne({ ownerId });
  return record ? toPublicBusiness(record) : null;
}

type CreateBattleInput = {
  ownerId: string;
  businessId: string;
  question: string;
  deadline: string;
  serviceDate: string;
  serviceWindow: string;
  maxCapacity: number;
  minBookings: number;
  additionalCosts: number;
  foodCostPct: number;
  staffingCost: number;
  wastageAllowance: number;
  options: BattleOption[];
  unlockThreshold?: number;
  unlockBonus?: string;
  status?: BattleStatus;
  shortCode?: string;
};

export async function createBattle(input: CreateBattleInput) {
  await ensureIndexes();
  const db = await getDb();

  let shortCode = input.shortCode ?? generateShortCode();
  let attempts = 0;
  while (
    (await db.collection<BattleRecord>(BATTLE_COLLECTION).findOne({ shortCode })) &&
    attempts < 10
  ) {
    shortCode = input.shortCode ? `${input.shortCode}${attempts}` : generateShortCode();
    attempts++;
  }

  const record: BattleRecord = {
    _id: new ObjectId(),
    businessId: new ObjectId(input.businessId),
    ownerId: input.ownerId,
    slug: slugify(input.question).slice(0, 60) || shortCode,
    shortCode,
    status: input.status ?? "live",
    question: input.question,
    deadline: new Date(input.deadline),
    serviceDate: input.serviceDate,
    serviceWindow: input.serviceWindow,
    maxCapacity: input.maxCapacity,
    minBookings: input.minBookings,
    additionalCosts: input.additionalCosts,
    foodCostPct: input.foodCostPct,
    staffingCost: input.staffingCost,
    wastageAllowance: input.wastageAllowance,
    options: input.options,
    unlockThreshold: input.unlockThreshold,
    unlockBonus: input.unlockBonus,
    createdAt: new Date(),
  };

  await db.collection<BattleRecord>(BATTLE_COLLECTION).insertOne(record);
  return toPublicBattle(record);
}

export async function getBattlesByOwner(ownerId: string) {
  await ensureIndexes();
  const db = await getDb();
  const battles = await db
    .collection<BattleRecord>(BATTLE_COLLECTION)
    .find({ ownerId })
    .sort({ createdAt: -1 })
    .toArray();
  return battles.map((b) => toPublicBattle(b));
}

export async function getBattleById(id: string, ownerId?: string) {
  await ensureIndexes();
  const db = await getDb();
  const filter: { _id: ObjectId; ownerId?: string } = { _id: new ObjectId(id) };
  if (ownerId) filter.ownerId = ownerId;

  const battle = await db.collection<BattleRecord>(BATTLE_COLLECTION).findOne(filter);
  if (!battle) return null;

  const business = await db
    .collection<BusinessRecord>(BUSINESS_COLLECTION)
    .findOne({ _id: battle.businessId });

  return toPublicBattle(battle, business ? toPublicBusiness(business) : undefined);
}

export async function getBattleByShortCode(shortCode: string) {
  await ensureIndexes();
  const db = await getDb();
  const battle = await db.collection<BattleRecord>(BATTLE_COLLECTION).findOne({ shortCode });
  if (!battle) return null;

  const business = await db
    .collection<BusinessRecord>(BUSINESS_COLLECTION)
    .findOne({ _id: battle.businessId });

  return toPublicBattle(battle, business ? toPublicBusiness(business) : undefined);
}

export async function getResponsesForBattle(battleId: string) {
  await ensureIndexes();
  const db = await getDb();
  return db
    .collection<ResponseRecord>(RESPONSE_COLLECTION)
    .find({ battleId: new ObjectId(battleId) })
    .toArray();
}

export async function getBattleDashboard(battleId: string, ownerId?: string): Promise<BattleDashboard | null> {
  const battle = await getBattleById(battleId, ownerId);
  if (!battle) return null;

  const responses = await getResponsesForBattle(battleId);
  const metrics = computeAllMetrics(battle.options, responses);
  const breakEven = computeBreakEven(battle, metrics);
  const { verdict, rationale } = computeVerdict(battle, metrics, breakEven);

  return {
    battle,
    metrics,
    breakEven,
    verdict,
    verdictRationale: rationale,
    totalResponses: responses.length,
  };
}

export async function getPublicBattleStats(shortCode: string) {
  const battle = await getBattleByShortCode(shortCode);
  if (!battle) return null;

  const responses = await getResponsesForBattle(battle.id);
  const metrics = computeAllMetrics(battle.options, responses);

  return { battle, metrics, totalResponses: responses.length };
}

type RespondInput = {
  battleId: string;
  optionId: string;
  commitmentLevel: CommitmentLevel;
  email?: string;
  phone?: string;
  preferredTime?: string;
  depositAmount?: number;
  molliePaymentId?: string;
  sessionToken?: string;
  reviewClaimed?: boolean;
};

export async function upsertResponse(input: RespondInput) {
  await ensureIndexes();
  const db = await getDb();
  const battleId = new ObjectId(input.battleId);
  const sessionToken = input.sessionToken ?? generateShortCode(12);

  const existing = await db.collection<ResponseRecord>(RESPONSE_COLLECTION).findOne({
    battleId,
    sessionToken,
  });

  const now = new Date();
  const update: Partial<ResponseRecord> = {
    optionId: input.optionId,
    commitmentLevel: input.commitmentLevel,
    updatedAt: now,
  };

  if (input.email !== undefined) update.email = input.email;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.preferredTime !== undefined) update.preferredTime = input.preferredTime;
  if (input.depositAmount !== undefined) update.depositAmount = input.depositAmount;
  if (input.molliePaymentId !== undefined) update.molliePaymentId = input.molliePaymentId;
  if (input.reviewClaimed !== undefined) update.reviewClaimed = input.reviewClaimed;

  if (existing) {
    const levels: CommitmentLevel[] = ["vote", "registered", "reserved", "deposited"];
    const currentIdx = levels.indexOf(existing.commitmentLevel);
    const newIdx = levels.indexOf(input.commitmentLevel);
    if (newIdx > currentIdx) {
      update.commitmentLevel = input.commitmentLevel;
    }

    await db.collection<ResponseRecord>(RESPONSE_COLLECTION).updateOne(
      { _id: existing._id },
      { $set: update },
    );
    return { ...existing, ...update, id: existing._id.toString(), sessionToken };
  }

  const record: ResponseRecord = {
    _id: new ObjectId(),
    battleId,
    optionId: input.optionId,
    commitmentLevel: input.commitmentLevel,
    email: input.email,
    phone: input.phone,
    preferredTime: input.preferredTime,
    depositAmount: input.depositAmount,
    molliePaymentId: input.molliePaymentId,
    reviewClaimed: input.reviewClaimed ?? false,
    sessionToken,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ResponseRecord>(RESPONSE_COLLECTION).insertOne(record);
  return { ...record, id: record._id.toString(), sessionToken };
}

export async function closeBattle(battleId: string, ownerId: string) {
  await ensureIndexes();
  const db = await getDb();
  const battle = await db.collection<BattleRecord>(BATTLE_COLLECTION).findOne({
    _id: new ObjectId(battleId),
    ownerId,
  });

  if (!battle) return null;

  const responses = await getResponsesForBattle(battleId);
  const metrics = computeAllMetrics(battle.options, responses);
  const winnerId = getWinningOptionId(metrics);
  const winnerMetrics = metrics.find((m) => m.optionId === winnerId);
  const winnerBookings = (winnerMetrics?.deposited ?? 0) + (winnerMetrics?.reserved ?? 0);

  const status: BattleStatus =
    winnerBookings >= battle.minBookings ? "closed" : "failed";

  await db.collection<BattleRecord>(BATTLE_COLLECTION).updateOne(
    { _id: battle._id },
    { $set: { status, winnerOptionId: winnerId ?? undefined } },
  );

  return getBattleById(battleId, ownerId);
}

export async function addToWaitlist(input: {
  email: string;
  businessType?: string;
  name?: string;
  source?: string;
}) {
  await ensureIndexes();
  const db = await getDb();
  const email = input.email.trim().toLowerCase();

  const existing = await db.collection<WaitlistRecord>(WAITLIST_COLLECTION).findOne({ email });
  if (existing) {
    return { id: existing._id.toString(), alreadyExists: true };
  }

  const record: WaitlistRecord = {
    _id: new ObjectId(),
    email,
    businessType: input.businessType,
    name: input.name,
    source: input.source ?? "landing",
    createdAt: new Date(),
  };

  await db.collection<WaitlistRecord>(WAITLIST_COLLECTION).insertOne(record);
  return { id: record._id.toString(), alreadyExists: false };
}

export async function getWaitlistCount() {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<WaitlistRecord>(WAITLIST_COLLECTION).countDocuments();
}

export async function ensurePublicDemoBattle() {
  await ensureIndexes();
  const db = await getDb();
  const existing = await db.collection<BattleRecord>(BATTLE_COLLECTION).findOne({ shortCode: "xK9m2p" });
  if (existing) {
    const business = await db
      .collection<BusinessRecord>(BUSINESS_COLLECTION)
      .findOne({ _id: existing.businessId });
    return toPublicBattle(existing, business ? toPublicBusiness(business) : undefined);
  }

  const ownerId = "demo-system";
  const business = await getOrCreateBusiness(ownerId, "Demo Café", "https://g.page/demo-cafe/review");

  const wednesday = new Date();
  wednesday.setDate(wednesday.getDate() + ((3 - wednesday.getDay() + 7) % 7 || 7));
  wednesday.setHours(20, 0, 0, 0);

  return createBattle({
    ownerId,
    businessId: business.id,
    question: "Should we open afternoons with sweet treats or savoury plates?",
    deadline: wednesday.toISOString(),
    serviceDate: "Thursday",
    serviceWindow: "3–5 PM",
    maxCapacity: 20,
    minBookings: 12,
    additionalCosts: 0,
    foodCostPct: 30,
    staffingCost: 45,
    wastageAllowance: 8,
    unlockThreshold: 16,
    unlockBonus: "free cardamom cream",
    options: [
      {
        id: "sweet",
        name: "Team Sweet",
        description: "Coffee + cake slice",
        price: 6,
        teamColor: "#e8b4b8",
        risk: "low",
      },
      {
        id: "savoury",
        name: "Team Savoury",
        description: "Half sandwich, soup & drink",
        price: 8,
        teamColor: "#9caf88",
        risk: "medium",
      },
    ],
    status: "live",
    shortCode: "xK9m2p",
  });
}

export async function seedDemoBattle(ownerId: string) {
  const existing = await getBattlesByOwner(ownerId);
  const demo = existing.find((b) => b.question.includes("sweet treats or savoury"));
  if (demo) return demo;

  const business = await getOrCreateBusiness(
    ownerId,
    "Demo Café",
    "https://g.page/demo-cafe/review",
  );

  const wednesday = new Date();
  wednesday.setDate(wednesday.getDate() + ((3 - wednesday.getDay() + 7) % 7 || 7));
  wednesday.setHours(20, 0, 0, 0);

  return createBattle({
    ownerId,
    businessId: business.id,
    question: "Should we open afternoons with sweet treats or savoury plates?",
    deadline: wednesday.toISOString(),
    serviceDate: "Thursday",
    serviceWindow: "3–5 PM",
    maxCapacity: 20,
    minBookings: 12,
    additionalCosts: 0,
    foodCostPct: 30,
    staffingCost: 45,
    wastageAllowance: 8,
    unlockThreshold: 16,
    unlockBonus: "free cardamom cream",
    options: [
      {
        id: "sweet",
        name: "Team Sweet",
        description: "Coffee + cake slice",
        price: 6,
        teamColor: "#e8b4b8",
        risk: "low",
      },
      {
        id: "savoury",
        name: "Team Savoury",
        description: "Half sandwich, soup & drink",
        price: 8,
        teamColor: "#9caf88",
        risk: "medium",
      },
    ],
    status: "live",
  });
}
