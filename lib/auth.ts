import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "crypto";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { promisify } from "util";
import { getDb } from "@/lib/mongodb";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = "apx_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const USER_COLLECTION = "users";
const SESSION_COLLECTION = "sessions";

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

type UserRecord = {
  _id: ObjectId;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: Date;
};

type SessionRecord = {
  _id: ObjectId;
  token: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
};

type AuthenticationInput = {
  email: string;
  password: string;
  name?: string;
};

type SessionPayload = {
  token: string;
  expiresAt: Date;
};

const indexesPromise = new Map<string, Promise<void>>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt.toISOString(),
  };
}

async function ensureIndexes() {
  const db = await getDb();

  if (!indexesPromise.has("auth")) {
    indexesPromise.set(
      "auth",
      Promise.all([
        db.collection<UserRecord>(USER_COLLECTION).createIndex({ email: 1 }, { unique: true }),
        db.collection<SessionRecord>(SESSION_COLLECTION).createIndex(
          { token: 1 },
          { unique: true },
        ),
        db.collection<SessionRecord>(SESSION_COLLECTION).createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 },
        ),
      ]).then(() => undefined),
    );
  }

  await indexesPromise.get("auth");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expectedKey = Buffer.from(hash, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

async function createSession(userId: ObjectId): Promise<SessionPayload> {
  await ensureIndexes();
  const db = await getDb();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await db.collection<SessionRecord>(SESSION_COLLECTION).insertOne({
    _id: new ObjectId(),
    token,
    userId,
    expiresAt,
    createdAt: new Date(),
  });

  return { token, expiresAt };
}

async function findUserByEmail(email: string) {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<UserRecord>(USER_COLLECTION).findOne({ email: normalizeEmail(email) });
}

export function sessionCookieOptions(expiresAt: Date, token = "") {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export async function registerWithEmailPassword(input: AuthenticationInput) {
  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name = input.name?.trim() || null;

  if (!email || !email.includes("@")) {
    throw new Error("Please provide a valid email address.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  await ensureIndexes();
  const db = await getDb();
  const existingUser = await db.collection<UserRecord>(USER_COLLECTION).findOne({ email });

  if (existingUser) {
    throw new Error("That email is already registered.");
  }

  const userId = new ObjectId();
  const createdAt = new Date();

  await db.collection<UserRecord>(USER_COLLECTION).insertOne({
    _id: userId,
    email,
    name,
    passwordHash: await hashPassword(password),
    createdAt,
  });

  const session = await createSession(userId);
  return {
    user: toPublicUser({
      _id: userId,
      email,
      name,
      passwordHash: "",
      createdAt,
    }),
    session,
  };
}

export async function loginWithEmailPassword(input: AuthenticationInput) {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new Error("No account found for that email address.");
  }

  const isValid = await verifyPassword(input.password.trim(), user.passwordHash);

  if (!isValid) {
    throw new Error("Incorrect password.");
  }

  const session = await createSession(user._id);
  return { user: toPublicUser(user), session };
}

export async function deleteSession(token?: string) {
  if (!token) {
    return;
  }

  await ensureIndexes();
  const db = await getDb();
  await db.collection<SessionRecord>(SESSION_COLLECTION).deleteOne({ token });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  await ensureIndexes();
  const db = await getDb();
  const session = await db.collection<SessionRecord>(SESSION_COLLECTION).findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  if (!session) {
    return null;
  }

  const user = await db.collection<UserRecord>(USER_COLLECTION).findOne({
    _id: session.userId,
  });

  return user ? toPublicUser(user) : null;
}
