import { Notice, type Plugin } from 'obsidian';
import { loadTimeNoticeShown } from '../Config/LoadTimeNoticeSetting';
import { State } from './Cache';
import type { TasksEvents } from './TasksEvents';

/**
 * t7 fork feature: load time notice. Spec: `fork-features/load-time-notice.md`.
 *
 * When the setting is on, shows a notice the first time Tasks' cache is warm after the plugin loaded: the time since
 * the plugin's code was evaluated, the time since the app's page started, the number of tasks, and when the workspace
 * was ready and Obsidian's metadata cache first resolved, the two events that start Tasks' scan, so waiting can be
 * told from scanning. Call once from the plugin's `onload()`, after the cache exists.
 */

// Evaluated when Obsidian loads the plugin's code, before onload() does its work.
const codeLoadedAt = performance.now();

export function startLoadTimeNotice(plugin: Plugin, events: TasksEvents): void {
    let shown = false;
    const seen: SeenTimes = { workspaceReady: null, metadataResolved: null };
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
            if (loadTimeNoticeShown()) {
                new Notice(loadTimeMessage(performance.now(), tasks.length, seen), 20000);
            }
        }),
    );
}

/** Times from the start of the app's page, in ms; null if the event has not happened yet */
export interface SeenTimes {
    workspaceReady: number | null;
    metadataResolved: number | null;
}

export function loadTimeMessage(
    now: number,
    taskCount: number,
    seen: SeenTimes = { workspaceReady: null, metadataResolved: null },
    loadedAt = codeLoadedAt,
): string {
    const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
    const when = (ms: number | null) => (ms === null ? 'not yet' : seconds(ms));
    return (
        `Tasks ready ${seconds(now - loadedAt)} after loading (${seconds(now)} after the app page started), ` +
        `${taskCount} tasks. After the page started: workspace ready ${when(seen.workspaceReady)}, ` +
        `metadata resolved ${when(seen.metadataResolved)}.`
    );
}
