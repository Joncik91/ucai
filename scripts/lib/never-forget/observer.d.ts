import type { Project, ObserverEvent, Severity } from "./types.js";
export interface Observer {
    log(event: Omit<ObserverEvent, "timestamp">): void;
    getEvents(): ObserverEvent[];
    getEventsByType(type: ObserverEvent["type"]): ObserverEvent[];
    getEventsBySeverity(severity: Severity): ObserverEvent[];
    clear(): void;
}
export declare function createObserver(): Observer;
export declare function observeActionWithoutReaction(observer: Observer, taskName: string, missingDependencyName: string): void;
export declare function observeGateBlocked(observer: Observer, gateName: string, reason: string): void;
export declare function observeGatePassed(observer: Observer, gateName: string): void;
export declare function observeStateTransition(observer: Observer, fromState: string, toState: string): void;
export declare function observeComplexityExceeded(observer: Observer, current: number, threshold: number): void;
export declare function scanForMissedReactions(project: Project, observer: Observer): number;
//# sourceMappingURL=observer.d.ts.map