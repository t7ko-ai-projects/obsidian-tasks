import type { Setting, SettingDefinitionItem } from 'obsidian';
import { defaultForkSettings } from './ForkSettings';
import { getSettings, updateSettings } from './Settings';

/**
 * t7 fork feature: load time notice. Spec: `fork-features/load-time-notice.md`.
 *
 * The setting that shows a notice with how long Tasks took to be ready, and its group in the settings tab.
 */

/**
 * Whether the notice shows: the saved setting, or the default if it is missing.
 */
export function loadTimeNoticeShown(): boolean {
    const t7: unknown = (getSettings() as { t7?: unknown }).t7;
    const diagnostics =
        typeof t7 === 'object' && t7 !== null ? (t7 as { diagnostics?: unknown }).diagnostics : undefined;
    const shown =
        typeof diagnostics === 'object' && diagnostics !== null
            ? (diagnostics as { loadTimeNotice?: unknown }).loadTimeNotice
            : undefined;
    return typeof shown === 'boolean' ? shown : defaultForkSettings().diagnostics.loadTimeNotice;
}

export async function saveLoadTimeNoticeShown(
    plugin: { saveSettings(): Promise<void> },
    shown: boolean,
): Promise<void> {
    const t7 = getSettings().t7;
    updateSettings({ t7: { ...t7, diagnostics: { ...t7?.diagnostics, loadTimeNotice: shown } } });
    await plugin.saveSettings();
}

export function loadTimeNoticeSettingsGroup(plugin: { saveSettings(): Promise<void> }): SettingDefinitionItem {
    return {
        type: 'group',
        heading: 'Diagnostics',
        items: [
            {
                name: 'Show load time',
                desc: 'Show a notice when Tasks is ready after Obsidian starts: how long it took, and how many tasks it found. For finding out why dashboards load slowly.',
                render: (setting: Setting) => {
                    setting.addToggle((toggle) => {
                        toggle.setValue(loadTimeNoticeShown()).onChange(async (value) => {
                            await saveLoadTimeNoticeShown(plugin, value);
                        });
                    });
                },
            },
        ],
    };
}
