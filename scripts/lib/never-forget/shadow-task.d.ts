import type { Project, Task, Reaction } from "./types.js";
export declare function generateShadowTasks(project: Project): Project;
export declare function generateShadowTasksForTask(project: Project, taskId: string): Task | null;
export declare function getIncompleteReactions(project: Project): Reaction[];
export declare function getReactionsForDependency(project: Project, dependencyId: string): Reaction[];
//# sourceMappingURL=shadow-task.d.ts.map