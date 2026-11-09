import { Notice, type Plugin } from 'obsidian';
import { loadTimeNoticeShown } from '../Config/LoadTimeNoticeSetting';
import { State } from './Cache';
import type { TasksEvents } from './TasksEvents';

/**
 * t7 fork feature: load time notice. Spec: `fork-features/load-time-notice.md`.
 *
 * When the setting is on, shows a notice the first time Tasks' cache is warm after the plugin loaded: the time since
 * the plugin's code was evaluated, the time since the app's page started, and the number of tasks. Call once from the
 * plugin's `onload()`, after the cache exists.
 */

// Evaluated when Obsidian loads the plugin's code, before onload() does its work.
const codeLoadedAt = performance.now();

export function startLoadTimeNotice(plugin: Plugin, events: TasksEvents): void {
    let shown = false;
    plugin.registerEvent(
        events.onCacheUpdate(({ tasks, state }) => {
            if (shown || state !== State.Warm) {
                return;
            }
            shown = true;
            if (loadTimeNoticeShown()) {
                new Notice(loadTimeMessage(performance.now(), tasks.length), 20000);
            }
        }),
    );
}

export function loadTimeMessage(now: number, taskCount: number, loadedAt = codeLoadedAt): string {
    const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
    return `Tasks ready ${seconds(now - loadedAt)} after loading (${seconds(now)} after the app page started), ${taskCount} tasks.`;
}
