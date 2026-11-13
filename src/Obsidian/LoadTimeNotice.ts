import type { Plugin } from 'obsidian';
import { State } from './Cache';
import type { TasksEvents } from './TasksEvents';

/**
 * t7 fork feature: load time notice. Spec: `fork-features/load-time-notice.md`.
 *
 * Records, the first time Tasks' cache is warm after the plugin loaded, a line for the settings tab (Diagnostics): the time since
 * the plugin's code was evaluated, the time since the app's page started, the number of tasks, and when the workspace
 * was ready and Obsidian's metadata cache first resolved, the two events that start Tasks' scan, so waiting can be
 * told from scanning, and when Tasks' own startup began, read its settings and finished. Call once from the plugin's `onload()`, after the cache exists.
 */

// Evaluated when Obsidian loads the plugin's code, before onload() does its work.
const codeLoadedAt = performance.now();

const startupMarks: Pick<SeenTimes, 'onloadStart' | 'settingsRead' | 'onloadEnd'> = {
    onloadStart: null,
    settingsRead: null,
    onloadEnd: null,
};

/**
 * Note when a step of the plugin's `onload()` was reached, in ms since the app's page started. Called from `main.ts`.
 */
export function markStartup(step: keyof typeof startupMarks): void {
    startupMarks[step] ??= performance.now();
}

let lastLoadTime: string | null = null;

/**
 * The line recorded at the last start of Obsidian, or null before Tasks was ready.
 */
export function lastLoadTimeMessage(): string | null {
    return lastLoadTime;
}

export function startLoadTimeNotice(plugin: Plugin, events: TasksEvents): void {
    let shown = false;
    const seen: SeenTimes = { ...startupMarks, workspaceReady: null, metadataResolved: null };
    plugin.app.workspace.onLayoutReady(() => {
        seen.workspaceReady ??= performance.now();
    });
    plugin.registerEvent(
        plugin.app.metadataCache.on('resolved', () => {
            seen.metadataResolved ??= performance.now();
        }),
    );
    plugin.registerEvent(
        events.onCacheUpdate(({ tasks, state }) => {
            if (shown || state !== State.Warm) {
                return;
            }
            shown = true;
            lastLoadTime = loadTimeMessage(performance.now(), tasks.length, { ...seen, ...startupMarks });
        }),
    );
}

/** Times from the start of the app's page, in ms; null if the event has not happened yet */
export interface SeenTimes {
    workspaceReady: number | null;
    metadataResolved: number | null;
    /** When `onload()` began, when it had read the settings, and when it finished */
    onloadStart: number | null;
    settingsRead: number | null;
    onloadEnd: number | null;
}

export function loadTimeMessage(
    now: number,
    taskCount: number,
    seen: Partial<SeenTimes> = {},
    loadedAt = codeLoadedAt,
): string {
    const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
    const when = (ms: number | null | undefined) => (ms === null || ms === undefined ? 'not yet' : seconds(ms));
    return (
        `Tasks ready ${seconds(now - loadedAt)} after loading (${seconds(now)} after the app page started), ` +
        `${taskCount} tasks. After the page started: workspace ready ${when(seen.workspaceReady)}, ` +
        `metadata resolved ${when(seen.metadataResolved)}. Tasks' own startup: began ${when(seen.onloadStart)}, ` +
        `settings read ${when(seen.settingsRead)}, done ${when(seen.onloadEnd)}.`
    );
}
