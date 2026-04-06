export declare class NeverForgetError extends Error {
    constructor(message: string);
}
export declare class GateBlockedError extends NeverForgetError {
    readonly blockers: string[];
    constructor(blockers: string[]);
}
export declare class InvalidStateTransitionError extends NeverForgetError {
    readonly from: string;
    readonly to: string;
    constructor(from: string, to: string, reason: string);
}
export declare class DependencyNotMetError extends NeverForgetError {
    readonly dependencyId: string;
    constructor(dependencyId: string, reason: string);
}
export declare class ProofRequiredError extends NeverForgetError {
    readonly dependencyId: string;
    constructor(dependencyId: string);
}
//# sourceMappingURL=errors.d.ts.map