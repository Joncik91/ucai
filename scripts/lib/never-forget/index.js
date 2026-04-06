// ============================================================================
// Never Forget — Redundancy & Logical Contingency Framework
// ============================================================================
// Errors
export { NeverForgetError, GateBlockedError, InvalidStateTransitionError, DependencyNotMetError, ProofRequiredError, } from "./errors.js";
// Project functions
export { createProject, addDependency, updateDependencyState, addTask, transitionState, evaluateEntryGate, passEntryGate, runPreFlightChecks, runPostFlightChecks, } from "./project.js";
// Logic gates
export { evaluateCondition, evaluateGate, evaluateAllGates, } from "./logic-gate.js";
// Shadow tasks
export { generateShadowTasks, generateShadowTasksForTask, getIncompleteReactions, getReactionsForDependency, } from "./shadow-task.js";
// Observer
export { createObserver, observeActionWithoutReaction, observeGateBlocked, observeGatePassed, observeStateTransition, observeComplexityExceeded, scanForMissedReactions, } from "./observer.js";
// Engine
export { ContingencyEngine } from "./engine.js";
//# sourceMappingURL=index.js.map