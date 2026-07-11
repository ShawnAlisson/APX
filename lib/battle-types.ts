import type { ObjectId } from "mongodb";

export type CommitmentLevel = "vote" | "registered" | "reserved" | "deposited";

export type BattleStatus = "draft" | "live" | "closed" | "failed";

export type BattleOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  teamColor: string;
  imageUrl?: string;
  risk?: "low" | "medium" | "high";
};

export type BusinessRecord = {
  _id: ObjectId;
  ownerId: string;
  name: string;
  slug: string;
  websiteUrl?: string;
  googleReviewUrl?: string;
  createdAt: Date;
};

export type BattleRecord = {
  _id: ObjectId;
  businessId: ObjectId;
  ownerId: string;
  slug: string;
  shortCode: string;
  status: BattleStatus;
  question: string;
  deadline: Date;
  serviceDate: string;
  serviceWindow: string;
  maxCapacity: number;
  minBookings: number;
  additionalCosts: number;
  foodCostPct: number;
  staffingCost: number;
  wastageAllowance: number;
  options: BattleOption[];
  winnerOptionId?: string;
  unlockThreshold?: number;
  unlockBonus?: string;
  createdAt: Date;
};

export type ResponseRecord = {
  _id: ObjectId;
  battleId: ObjectId;
  optionId: string;
  commitmentLevel: CommitmentLevel;
  email?: string;
  phone?: string;
  preferredTime?: string;
  depositAmount?: number;
  molliePaymentId?: string;
  reviewClaimed?: boolean;
  sessionToken: string;
  createdAt: Date;
  updatedAt: Date;
};

export type WaitlistRecord = {
  _id: ObjectId;
  email: string;
  businessType?: string;
  name?: string;
  source: string;
  createdAt: Date;
};

export type PublicBusiness = {
  id: string;
  name: string;
  slug: string;
  websiteUrl?: string;
  googleReviewUrl?: string;
};

export type PublicBattle = {
  id: string;
  shortCode: string;
  status: BattleStatus;
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
  winnerOptionId?: string;
  unlockThreshold?: number;
  unlockBonus?: string;
  business?: PublicBusiness;
};

export type BattleMetrics = {
  optionId: string;
  votes: number;
  registered: number;
  reserved: number;
  deposited: number;
  revenueCommitted: number;
  battleScore: number;
};

export type BreakEvenResult = {
  expectedRevenue: number;
  foodCost: number;
  totalCost: number;
  profit: number;
  bookingsNeeded: number;
  leadingOptionId: string | null;
  leadingBookings: number;
};

export type Verdict = "proceed" | "modify" | "cancel";

export type BattleDashboard = {
  battle: PublicBattle;
  metrics: BattleMetrics[];
  breakEven: BreakEvenResult;
  verdict: Verdict;
  verdictRationale: string;
  totalResponses: number;
};
