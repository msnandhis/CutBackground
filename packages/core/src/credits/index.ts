import "server-only";

import { eq, sql } from "drizzle-orm";
import { db } from "@repo/database";
import { creditTransactions, userCredits } from "@repo/database";
import { logger } from "../logger";

export type CreditTransactionType =
  | "purchase"
  | "usage"
  | "refund"
  | "bonus"
  | "expiry";

export interface CreditBalance {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
}

export async function getUserCredits(userId: string): Promise<CreditBalance> {
  const result = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return {
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
    };
  }

  const record = result[0];
  return {
    balance: record.balance,
    totalPurchased: record.totalPurchased,
    totalUsed: record.totalUsed,
  };
}

export async function ensureUserCreditsRecord(userId: string): Promise<void> {
  const existing = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userCredits).values({
      userId,
      balance: 0,
      totalPurchased: 0,
      totalUsed: 0,
    });
  }
}

export async function hasCredits(
  userId: string,
  amount: number,
): Promise<boolean> {
  const credits = await getUserCredits(userId);
  return credits.balance >= amount;
}

export async function deductCredits(
  userId: string,
  amount: number,
  reference: string,
  description?: string,
): Promise<{ success: boolean; balanceAfter: number; error?: string }> {
  if (amount <= 0) {
    return {
      success: false,
      balanceAfter: 0,
      error: "Amount must be positive",
    };
  }

  try {
    await ensureUserCreditsRecord(userId);

    const result = await db
      .update(userCredits)
      .set({
        balance: sql`${userCredits.balance} - ${amount}`,
        totalUsed: sql`${userCredits.totalUsed} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        balanceAfter: 0,
        error: "User credits record not found",
      };
    }

    const balanceAfter = result[0].balance;

    if (balanceAfter < 0) {
      logger.warn(
        { userId, amount, balanceAfter },
        "Credit deduction would result in negative balance",
      );

      await db
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} + ${amount}`,
          totalUsed: sql`${userCredits.totalUsed} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));

      return {
        success: false,
        balanceAfter: 0,
        error: "Insufficient credits",
      };
    }

    await db.insert(creditTransactions).values({
      userId,
      amount: -amount,
      balanceAfter,
      type: "usage",
      reference,
      description: description ?? "Background removal job",
    });

    logger.info(
      { userId, amount, balanceAfter, reference },
      "Credits deducted",
    );

    return {
      success: true,
      balanceAfter,
    };
  } catch (error) {
    logger.error(
      {
        userId,
        amount,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to deduct credits",
    );

    return {
      success: false,
      balanceAfter: 0,
      error: "Failed to deduct credits",
    };
  }
}

export async function addCredits(
  userId: string,
  amount: number,
  type: CreditTransactionType,
  reference: string | null,
  description?: string,
  paymentProvider?: string,
  paymentId?: string,
): Promise<{ success: boolean; balanceAfter: number; error?: string }> {
  if (amount <= 0) {
    return {
      success: false,
      balanceAfter: 0,
      error: "Amount must be positive",
    };
  }

  try {
    await ensureUserCreditsRecord(userId);

    const result = await db
      .update(userCredits)
      .set({
        balance: sql`${userCredits.balance} + ${amount}`,
        totalPurchased:
          type === "purchase" || type === "bonus"
            ? sql`${userCredits.totalPurchased} + ${amount}`
            : userCredits.totalPurchased,
        lastPurchasedAt:
          type === "purchase" ? new Date() : userCredits.lastPurchasedAt,
        updatedAt: new Date(),
      })
      .where(eq(userCredits.userId, userId))
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        balanceAfter: 0,
        error: "Failed to update credits",
      };
    }

    const balanceAfter = result[0].balance;

    await db.insert(creditTransactions).values({
      userId,
      amount,
      balanceAfter,
      type,
      reference,
      description,
      paymentProvider,
      paymentId,
    });

    logger.info(
      { userId, amount, balanceAfter, type, reference },
      "Credits added",
    );

    return {
      success: true,
      balanceAfter,
    };
  } catch (error) {
    logger.error(
      {
        userId,
        amount,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      "Failed to add credits",
    );

    return {
      success: false,
      balanceAfter: 0,
      error: "Failed to add credits",
    };
  }
}

export async function refundCredits(
  userId: string,
  amount: number,
  reference: string,
  description?: string,
): Promise<{ success: boolean; balanceAfter: number; error?: string }> {
  if (amount <= 0) {
    return {
      success: false,
      balanceAfter: 0,
      error: "Amount must be positive",
    };
  }

  return addCredits(userId, amount, "refund", reference, description);
}
