import { DashboardShell } from "@/components/site/dashboard-shell";
import { getBillingData } from "@/features/dashboard/lib/server/billing-data";
import { isBillingConfigured } from "@repo/core/env";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await getBillingData();
  const billingEnabled = isBillingConfigured();

  return (
    <DashboardShell
      title="Billing & Credits"
      description={`Manage your credits and view payment history for ${data.viewer.email}.`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-500">Available Credits</p>
          <p className="mt-3 font-heading text-4xl font-bold text-brand-dark">
            {data.credits.balance.toLocaleString()}
          </p>
          <p className="mt-3 text-sm text-neutral-500">
            Credits available for background removal operations.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-4">
            <div>
              <p className="text-xs text-neutral-400">Total Purchased</p>
              <p className="mt-1 font-semibold text-neutral-700">
                {data.credits.totalPurchased.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Total Used</p>
              <p className="mt-1 font-semibold text-neutral-700">
                {data.credits.totalUsed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-brand-dark">
            Purchase Credits
          </h2>
          {!billingEnabled ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
              Billing is not currently configured. Contact support to purchase
              credits.
            </div>
          ) : data.plans.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
              No credit packages are currently available. Check back later or
              contact support.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-4 ${
                    plan.isPopular
                      ? "border-brand-magenta bg-brand-dark text-white"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  {plan.isPopular && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-pink-200">
                      Most Popular
                    </p>
                  )}
                  <p
                    className={`font-semibold ${plan.isPopular ? "text-white" : "text-neutral-900"}`}
                  >
                    {plan.name}
                  </p>
                  <p
                    className={`mt-1 text-sm ${plan.isPopular ? "text-white/70" : "text-neutral-500"}`}
                  >
                    {plan.formattedCredits} credits
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span
                      className={`font-heading text-2xl font-bold ${
                        plan.isPopular ? "text-white" : "text-brand-dark"
                      }`}
                    >
                      {plan.formattedPrice}
                    </span>
                    {!plan.isPopular && plan.priceCents === 0 && (
                      <span className="text-sm text-neutral-500">Free</span>
                    )}
                  </div>
                  {plan.description && (
                    <p
                      className={`mt-2 text-sm ${plan.isPopular ? "text-white/70" : "text-neutral-600"}`}
                    >
                      {plan.description}
                    </p>
                  )}
                  <button
                    className={`mt-4 w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                      plan.isPopular
                        ? "bg-pink-500 text-white hover:bg-pink-600"
                        : "bg-neutral-900 text-white hover:bg-neutral-800"
                    }`}
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-brand-dark">
            Recent Transactions
          </h2>
          {data.transactions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
              No credit transactions yet. Purchase credits or run background
              removal jobs to see transaction history.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data.transactions.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount} credits
                    </p>
                    <p className="text-sm text-neutral-500">
                      {tx.description || tx.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600">{tx.createdAt}</p>
                    <p className="text-xs text-neutral-400">
                      Balance: {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-brand-dark">
            Payment History
          </h2>
          {data.payments.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
              No payments yet. Purchase a credit package to see payment history.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data.payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-2xl bg-neutral-50 p-4"
                >
                  <div>
                    <p className="font-medium text-neutral-900">
                      {payment.planName || "Credits"}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {payment.credits.toLocaleString()} credits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-neutral-900">
                      {payment.amount}
                    </p>
                    <p className="text-sm text-neutral-500">{payment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
