import type { Project, ProjectConfig, ValidationResult, GateResult, FlightCheckResult, ObserverEvent, EngineSnapshot, Dependency, DependencyState, Task, LogicGate } from "./types.js";
export declare class ContingencyEngine {
    private project;
    private observer;
    constructor(config: ProjectConfig);
    static fromSnapshot(snapshot: EngineSnapshot): ContingencyEngine;
    toSnapshot(): EngineSnapshot;
    getProject(): Readonly<Project>;
    getEvents(): ObserverEvent[];
    getErrors(): ObserverEvent[];
    getWarnings(): ObserverEvent[];
    addDependency(dependency: Dependency): this;
    updateDependencyState(dependencyId: string, newState: DependencyState, proofOfWork?: string): this;
    addTask(task: Task): this;
    updateTaskState(taskId: string, newState: Task["state"]): this;
    addLogicGate(gate: LogicGate): this;
    generateShadowTasks(): this;
    evaluateEntryGate(): GateResult;
    passEntryGate(): this;
    evaluateLogicGates(): ValidationResult;
    runPreFlightChecks(): FlightCheckResult;
    runPostFlightChecks(): FlightCheckResult;
    startBuilding(): this;
    submitForReview(): this;
    markComplete(): this;
    deploy(): this;
    checkComplexity(): {
        exceeded: boolean;
        score: number;
        threshold: number;
    };
    scanForMissedReactions(): number;
    private calculateComplexity;
}
//# sourceMappingURL=engine.d.ts.map