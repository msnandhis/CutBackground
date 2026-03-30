import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJsonBody, toApiErrorResponse } from "@/lib/server/api";
import {
  createCheckoutSession,
  requireDashboardApiSession,
} from "@/features/dashboard/lib/server/billing";
import { enforceRateLimit } from "@/lib/server/rate-limit";

const checkoutRequestSchema = z.object({
  planId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function POST(request: Request) {
  try {
    const session = await requireDashboardApiSession(request);

    await enforceRateLimit({
      identifier: `user:${session.user.id}:checkout:create`,
      maxRequests: 10,
      windowSeconds: 60,
      code: "RATE_LIMITED",
      message: "Too many checkout attempts in a short period.",
    });

    const input = await parseJsonBody(request, checkoutRequestSchema);
    const result = await createCheckoutSession({
      userId: session.user.id,
      userEmail: session.user.email,
      planId: input.planId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
