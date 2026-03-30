import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import {
  db,
  creditTransactions,
  userCredits,
  plans,
  payments,
} from "@repo/database";
import { auth } from "@repo/core/auth/server";
import { isAuthConfigured, isDatabaseConfigured } from "@repo/core/env";
import { routes } from "@/lib/routes";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatCredits(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(valueCents: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(valueCents / 100);
}

export type BillingCreditBalance = {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
};

export type BillingTransaction = {
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  description: string | null;
  createdAt: string;
};

export type BillingPlan = {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
  currency: string;
  isPopular: boolean;
  formattedPrice: string;
  formattedCredits: string;
};

export type BillingPayment = {
  id: string;
  planId: string | null;
  planName: string | null;
  amount: string;
  credits: number;
  status: string;
  createdAt: string;
  completedAt: string | null;
};

export type BillingData = {
  viewer: {
    id: string;
    name: string;
    email: string;
  };
  credits: BillingCreditBalance;
  transactions: BillingTransaction[];
  plans: BillingPlan[];
  payments: BillingPayment[];
};

export const getBillingData = cache(async (): Promise<BillingData> => {
  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    redirect(
      `${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardBilling)}`,
    );
  }

  const requestHeaders = await headers();
  let session = null;

  try {
    session = await auth.api.getSession({
      headers: requestHeaders,
    });
  } catch {
    redirect(
      `${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardBilling)}`,
    );
  }

  if (!session) {
    redirect(
      `${routes.login}?redirectTo=${encodeURIComponent(routes.dashboardBilling)}`,
    );
  }

  const viewer = {
    id: session.user.id,
    name: session.user.name || "Workspace user",
    email: session.user.email,
  };

  let credits: BillingCreditBalance = {
    balance: 0,
    totalPurchased: 0,
    totalUsed: 0,
  };

  let transactions: BillingTransaction[] = [];
  let paymentsList: BillingPayment[] = [];

  try {
    const creditRows = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, viewer.id))
      .limit(1);

    if (creditRows.length > 0) {
      credits = {
        balance: creditRows[0].balance,
        totalPurchased: creditRows[0].totalPurchased,
        totalUsed: creditRows[0].totalUsed,
      };
    }

    const transactionRows = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, viewer.id))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(20);

    transactions = transactionRows.map((row) => ({
      id: row.id,
      amount: row.amount,
      balanceAfter: row.balanceAfter,
      type: row.type,
      description: row.description,
      createdAt: formatDate(row.createdAt),
    }));

    const paymentRows = await db
      .select({
        id: payments.id,
        planId: payments.planId,
        amountCents: payments.amountCents,
        currency: payments.currency,
        credits: payments.credits,
        status: payments.status,
        createdAt: payments.createdAt,
        completedAt: payments.completedAt,
        planName: plans.name,
      })
      .from(payments)
      .leftJoin(plans, eq(payments.planId, plans.id))
      .where(eq(payments.userId, viewer.id))
      .orderBy(desc(payments.createdAt))
      .limit(10);

    paymentsList = paymentRows.map((row) => ({
      id: row.id,
      planId: row.planId,
      planName: row.planName ?? null,
      amount: formatCurrency(row.amountCents, row.currency),
      credits: row.credits,
      status: row.status,
      createdAt: formatDate(row.createdAt),
      completedAt: row.completedAt ? formatDate(row.completedAt) : null,
    }));
  } catch {
    // Return empty data if database queries fail
  }

  let plansData: BillingPlan[] = [];

  try {
    const planRows = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.priceCents);

    plansData = planRows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      credits: row.credits,
      priceCents: row.priceCents,
      currency: row.currency,
      isPopular: row.isPopular,
      formattedPrice: formatCurrency(row.priceCents, row.currency),
      formattedCredits: formatCredits(row.credits),
    }));
  } catch {
    // Return empty plans if database queries fail
  }

  return {
    viewer,
    credits,
    transactions,
    plans: plansData,
    payments: paymentsList,
  };
});
