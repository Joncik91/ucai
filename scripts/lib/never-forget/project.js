import { GateBlockedError, InvalidStateTransitionError } from "./errors.js";
const VALID_TRANSITIONS = {
    defined: ["gated"],
    gated: ["building"],
    building: ["review", "building"],
    review: ["complete", "building"],
    complete: ["deployed", "review"],
    deployed: [],
};
export function createProject(config) {
    return {
        id: config.id,
        name: config.name,
        description: config.description ?? "",
        state: "defined",
        dependencies: config.dependencies ?? [],
        logicGates: config.logicGates ?? [],
        tasks: config.tasks ?? [],
        complexityThreshold: config.complexityThreshold ?? 10,
        requireProofOfWork: config.requireProofOfWork ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}
export function addDependency(project, dependency) {
    const existing = project.dependencies.find((d) => d.id === dependency.id);
    if (existing) {
        throw new Error(`Dependency ${dependency.id} already exists`);
    }
    return touch({
        ...project,
        dependencies: [...project.dependencies, dependency],
    });
}
export function updateDependencyState(project, dependencyId, newState, proofOfWork) {
    const deps = project.dependencies.map((d) => d.id === dependencyId
        ? { ...d, state: newState, proofOfWork: proofOfWork ?? d.proofOfWork }
        : d);
    if (deps.every((d) => d.id !== dependencyId)) {
        throw new Error(`Dependency ${dependencyId} not found`);
    }
    return touch({ ...project, dependencies: deps });
}
export function addTask(project, task) {
    return touch({
        ...project,
        tasks: [...project.tasks, task],
    });
}
export function transitionState(project, newState) {
    const allowed = VALID_TRANSITIONS[project.state];
    if (!allowed.includes(newState)) {
        throw new InvalidStateTransitionError(project.state, newState, `Valid transitions from ${project.state}: ${allowed.join(", ")}`);
    }
    return touch({ ...project, state: newState });
}
// --- Tier 1: Entry Gate (Binary Lock) ---
export function evaluateEntryGate(project) {
    const blockers = [];
    const messages = [];
    if (project.dependencies.length === 0) {
        blockers.push("No dependencies defined — at least one required dependency must exist");
        messages.push("FAIL: No dependencies defined");
    }
    for (const dep of project.dependencies) {
        if (dep.priority === "required") {
            if (dep.state === "undefined" || dep.state === "identified") {
                blockers.push(`Required dependency "${dep.name}" (${dep.id}) is not ready (state: ${dep.state})`);
                messages.push(`FAIL: ${dep.name} not ready`);
            }
            if (project.requireProofOfWork && !dep.proofOfWork) {
                blockers.push(`Required dependency "${dep.name}" (${dep.id}) has no proof of work`);
                messages.push(`FAIL: ${dep.name} missing proof of work`);
            }
        }
    }
    return {
        passed: blockers.length === 0,
        blocked: blockers.length > 0,
        messages: blockers.length === 0
            ? ["All entry gate checks passed"]
            : messages,
    };
}
export function passEntryGate(project) {
    const result = evaluateEntryGate(project);
    if (result.blocked) {
        throw new GateBlockedError(result.messages);
    }
    return transitionState(project, "gated");
}
// --- Pre-flight & Post-flight checks ---
export function runPreFlightChecks(project) {
    const checks = [];
    // Check: All required dependencies defined
    const requiredDeps = project.dependencies.filter((d) => d.priority === "required");
    checks.push({
        passed: requiredDeps.length > 0,
        message: requiredDeps.length > 0
            ? `${requiredDeps.length} required dependencies defined`
            : "No required dependencies defined",
    });
    // Check: All required dependencies at least identified
    const unidentified = requiredDeps.filter((d) => d.state === "undefined");
    checks.push({
        passed: unidentified.length === 0,
        message: unidentified.length === 0
            ? "All required dependencies identified"
            : `Unidentified dependencies: ${unidentified.map((d) => d.name).join(", ")}`,
    });
    // Check: Logic gates exist
    checks.push({
        passed: project.logicGates.length > 0,
        message: project.logicGates.length > 0
            ? `${project.logicGates.length} logic gates configured`
            : "No logic gates configured — consider adding conditional rules",
    });
    return {
        allPassed: checks.every((c) => c.passed),
        checks,
    };
}
export function runPostFlightChecks(project) {
    const checks = [];
    // Check: All required dependencies verified
    const requiredDeps = project.dependencies.filter((d) => d.priority === "required");
    const unverified = requiredDeps.filter((d) => d.state !== "verified" && d.state !== "complete");
    checks.push({
        passed: unverified.length === 0,
        message: unverified.length === 0
            ? "All required dependencies verified/complete"
            : `Unverified: ${unverified.map((d) => d.name).join(", ")}`,
    });
    // Check: All tasks complete
    const incompleteTasks = project.tasks.filter((t) => t.state !== "complete");
    checks.push({
        passed: incompleteTasks.length === 0,
        message: incompleteTasks.length === 0
            ? "All tasks complete"
            : `${incompleteTasks.length} incomplete tasks remain`,
    });
    // Check: All reactions complete
    const allReactions = project.tasks.flatMap((t) => t.reactions);
    const incompleteReactions = allReactions.filter((r) => r.state !== "complete");
    checks.push({
        passed: incompleteReactions.length === 0,
        message: incompleteReactions.length === 0
            ? "All reactions complete"
            : `${incompleteReactions.length} incomplete reactions`,
    });
    // Check: Proof of work (if required)
    if (project.requireProofOfWork) {
        const missingProof = requiredDeps.filter((d) => !d.proofOfWork);
        checks.push({
            passed: missingProof.length === 0,
            message: missingProof.length === 0
                ? "All proof of work provided"
                : `Missing proof: ${missingProof.map((d) => d.name).join(", ")}`,
        });
    }
    return {
        allPassed: checks.every((c) => c.passed),
        checks,
    };
}
function touch(project) {
    return { ...project, updatedAt: new Date().toISOString() };
}
//# sourceMappingURL=project.js.map