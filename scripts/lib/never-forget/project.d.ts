import type { Project, ProjectConfig, ProjectState, Dependency, DependencyState, Task, GateResult, FlightCheckResult } from "./types.js";
export declare function createProject(config: ProjectConfig): Project;
export declare function addDependency(project: Project, dependency: Dependency): Project;
export declare function updateDependencyState(project: Project, dependencyId: string, newState: DependencyState, proofOfWork?: string): Project;
export declare function addTask(project: Project, task: Task): Project;
export declare function transitionState(project: Project, newState: ProjectState): Project;
export declare function evaluateEntryGate(project: Project): GateResult;
export declare function passEntryGate(project: Project): Project;
export declare function runPreFlightChecks(project: Project): FlightCheckResult;
export declare function runPostFlightChecks(project: Project): FlightCheckResult;
//# sourceMappingURL=project.d.ts.map