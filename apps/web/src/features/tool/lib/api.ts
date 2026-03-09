import { z } from "zod";

export const toolJobRouteParamsSchema = z.object({
    jobId: z.string().uuid(),
});
