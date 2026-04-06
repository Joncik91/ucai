export class NeverForgetError extends Error {
    constructor(message) {
        super(message);
        this.name = "NeverForgetError";
    }
}
export class GateBlockedError extends NeverForgetError {
    blockers;
    constructor(blockers) {
        super(`Entry gate blocked: ${blockers.join("; ")}`);
        this.name = "GateBlockedError";
        this.blockers = blockers;
    }
}
export class InvalidStateTransitionError extends NeverForgetError {
    from;
    to;
    constructor(from, to, reason) {
        super(`Cannot transition from ${from} to ${to}: ${reason}`);
        this.name = "InvalidStateTransitionError";
        this.from = from;
        this.to = to;
    }
}
export class DependencyNotMetError extends NeverForgetError {
    dependencyId;
    constructor(dependencyId, reason) {
        super(`Dependency ${dependencyId} not met: ${reason}`);
        this.name = "DependencyNotMetError";
        this.dependencyId = dependencyId;
    }
}
export class ProofRequiredError extends NeverForgetError {
    dependencyId;
    constructor(dependencyId) {
        super(`Proof of work required for dependency: ${dependencyId}`);
        this.name = "ProofRequiredError";
        this.dependencyId = dependencyId;
    }
}
//# sourceMappingURL=errors.js.map