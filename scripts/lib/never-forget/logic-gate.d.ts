import type { Project, LogicGate, LogicCondition, ValidationResult } from "./types.js";
export declare function evaluateCondition(condition: LogicCondition, project: Project): boolean;
export declare function evaluateGate(gate: LogicGate, project: Project): {
    triggered: boolean;
    action: LogicGate["action"];
};
export declare function evaluateAllGates(project: Project): ValidationResult;
//# sourceMappingURL=logic-gate.d.ts.map