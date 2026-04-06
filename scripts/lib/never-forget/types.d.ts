export type DependencyState = "undefined" | "identified" | "drafted" | "in_progress" | "complete" | "verified";
export type TaskState = "pending" | "in_progress" | "complete" | "blocked";
export type ProjectState = "defined" | "gated" | "building" | "review" | "complete" | "deployed";
export type Severity = "info" | "warning" | "error";
export type DependencyPriority = "required" | "recommended" | "optional";
export interface Dependency {
    id: string;
    name: string;
    priority: DependencyPriority;
    state: DependencyState;
    proofOfWork?: string;
    description?: string;
}
export interface Reaction {
    id: string;
    dependencyId: string;
    description: string;
    state: TaskState;
    proofOfWork?: string;
}
export interface Task {
    id: string;
    name: string;
    description?: string;
    state: TaskState;
    reactions: Reaction[];
}
export interface LogicCondition {
    subject: string;
    property: string;
    operator: "eq" | "neq" | "in" | "not_in" | "exists";
    value: string | string[];
}
export interface LogicAction {
    type: "block" | "warn" | "require_state" | "generate_task" | "notify";
    target: string;
    message?: string;
}
export interface LogicGate {
    id: string;
    name: string;
    condition: LogicCondition;
    action: LogicAction;
    enabled: boolean;
}
export interface CheckResult {
    passed: boolean;
    message: string;
    details?: string;
}
export interface PreFlightCheck {
    id: string;
    name: string;
    validate: (project: Project) => CheckResult;
}
export interface PostFlightCheck {
    id: string;
    name: string;
    validate: (project: Project) => CheckResult;
}
export interface ObserverEvent {
    timestamp: string;
    type: "action_without_reaction" | "gate_blocked" | "gate_passed" | "state_transition" | "complexity_exceeded" | "dependency_added" | "shadow_task_generated" | "proof_required";
    subject: string;
    details: string;
    severity: Severity;
}
export interface ProjectConfig {
    id: string;
    name: string;
    description?: string;
    dependencies?: Dependency[];
    logicGates?: LogicGate[];
    tasks?: Task[];
    complexityThreshold?: number;
    requireProofOfWork?: boolean;
}
export interface Project {
    id: string;
    name: string;
    description: string;
    state: ProjectState;
    dependencies: Dependency[];
    logicGates: LogicGate[];
    tasks: Task[];
    complexityThreshold: number;
    requireProofOfWork: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface GateResult {
    passed: boolean;
    blocked: boolean;
    messages: string[];
}
export interface FlightCheckResult {
    allPassed: boolean;
    checks: CheckResult[];
}
export interface EngineSnapshot {
    project: Project;
    events: ObserverEvent[];
}
//# sourceMappingURL=types.d.ts.map