import type { App } from 'obsidian';
import type { Task } from '../Task/Task';
import { getTaskLineAndFile } from './File';

/**
 * t7 fork feature: jump to a rendered task's line. Spec: `fork-features/jump-to-task.md`.
 *
 * `Jump to` in the context menu of a rendered task (query results and Reading mode) opens the task's note at the
 * task's line, as a click on its backlink does. Register the app once from the plugin's `onload()`.
 */

let app: App | undefined;

export function registerJumpToTask(newApp: App | undefined): void {
    app = newApp;
}

/**
 * Whether {@link jumpToTask} can work: it needs the app, which the plugin registers when it loads.
 */
export function jumpToTaskAvailable(): boolean {
    return app !== undefined;
}

/**
 * Open the note of {@link task} in the current tab, with the cursor on the task's line. If the line can't be found
 * (the note changed meanwhile), a notice says so, as for the backlink.
 */
export async function jumpToTask(task: Task): Promise<void> {
    if (app === undefined) {
        return;
    }
    const result = await getTaskLineAndFile(task, app.vault);
    if (result === undefined) {
        return;
    }
    const [line, file] = result;
    await app.workspace.getLeaf(false).openFile(file, { eState: { line } });
}
