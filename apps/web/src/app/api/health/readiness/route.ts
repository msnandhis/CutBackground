import { NextResponse } from "next/server";
import { getProductionReadinessSummary } from "@repo/core/env";

export async function GET() {
    const summary = getProductionReadinessSummary();
    const blockingDependencies = summary.dependencyStatuses.filter(
        (dependency) =>
            dependency.name === "database" ||
            dependency.name === "auth" ||
            dependency.name === "background-queue" ||
            dependency.name === "r2" ||
            dependency.name === "replicate"
    );
    const ready = blockingDependencies.every((dependency) => dependency.configured);

    return NextResponse.json({
        ready,
        checkedAt: new Date().toISOString(),
    }, {
        status: ready ? 200 : 503,
    });
}
