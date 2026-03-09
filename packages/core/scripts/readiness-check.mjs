import { getProductionReadinessSummary } from "../src/env/index.ts";

const summary = getProductionReadinessSummary();
const blockingDependencies = summary.dependencyStatuses.filter(
    (dependency) =>
        dependency.name === "database" ||
        dependency.name === "auth" ||
        dependency.name === "background-queue" ||
        dependency.name === "r2" ||
        dependency.name === "replicate"
);

for (const dependency of summary.dependencyStatuses) {
    const status = dependency.configured ? "OK" : "MISSING";
    const note = dependency.note ? ` (${dependency.note})` : "";
    const missingEnv =
        dependency.missingEnv.length > 0 ? ` -> ${dependency.missingEnv.join(", ")}` : "";

    console.log(`${status} ${dependency.name}${missingEnv}${note}`);
}

if (blockingDependencies.some((dependency) => !dependency.configured)) {
    process.exitCode = 1;
}
