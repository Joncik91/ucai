// --- Logic Gate Evaluation ---
export function evaluateCondition(condition, project) {
    const value = resolveProperty(condition.subject, condition.property, project);
    switch (condition.operator) {
        case "eq":
            return value === condition.value;
        case "neq":
            return value !== condition.value;
        case "in":
            return Array.isArray(condition.value) && condition.value.includes(String(value));
        case "not_in":
            return Array.isArray(condition.value) && !condition.value.includes(String(value));
        case "exists":
            return value !== undefined && value !== null && value !== "";
        default:
            return false;
    }
}
export function evaluateGate(gate, project) {
    if (!gate.enabled) {
        return { triggered: false, action: gate.action };
    }
    const triggered = evaluateCondition(gate.condition, project);
    return { triggered, action: gate.action };
}
export function evaluateAllGates(project) {
    const errors = [];
    const warnings = [];
    for (const gate of project.logicGates) {
        if (!gate.enabled)
            continue;
        const { triggered, action } = evaluateGate(gate, project);
        if (triggered) {
            const msg = `Logic gate "${gate.name}": ${action.message ?? `Action: ${action.type} on ${action.target}`}`;
            switch (action.type) {
                case "block":
                    errors.push(msg);
                    break;
                case "warn":
                    warnings.push(msg);
                    break;
                default:
                    warnings.push(msg);
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
// --- Property Resolver ---
function resolveProperty(subject, property, project) {
    // "project" refers to the project itself
    if (subject === "project" || subject === project.id) {
        return resolveProjectProperty(property, project);
    }
    // Otherwise it's a dependency ID
    const dep = project.dependencies.find((d) => d.id === subject);
    if (dep) {
        return resolveDependencyProperty(property, dep);
    }
    const task = project.tasks.find((t) => t.id === subject);
    if (task) {
        return resolveTaskProperty(property, task);
    }
    return undefined;
}
function resolveProjectProperty(property, project) {
    switch (property) {
        case "state":
            return project.state;
        case "dependencyCount":
            return String(project.dependencies.length);
        case "taskCount":
            return String(project.tasks.length);
        case "complexityThreshold":
            return String(project.complexityThreshold);
        default:
            return undefined;
    }
}
function resolveDependencyProperty(property, dep) {
    switch (property) {
        case "state":
            return dep.state;
        case "name":
            return dep.name;
        case "priority":
            return dep.priority;
        case "hasProof":
            return dep.proofOfWork ? "true" : "false";
        default:
            return undefined;
    }
}
function resolveTaskProperty(property, task) {
    switch (property) {
        case "state":
            return task.state;
        case "name":
            return task.name;
        default:
            return undefined;
    }
}
//# sourceMappingURL=logic-gate.js.map