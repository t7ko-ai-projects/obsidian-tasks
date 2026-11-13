import type { Setting, SettingDefinitionItem } from 'obsidian';
import { lastLoadTimeMessage } from '../Obsidian/LoadTimeNotice';

/**
 * t7 fork feature: load time notice. Spec: `fork-features/load-time-notice.md`.
 *
 * The `Diagnostics` group of the settings tab: a line with how long Tasks took to be ready at the last start.
 */
export function loadTimeNoticeSettingsGroup(): SettingDefinitionItem {
    return {
        type: 'group',
        heading: 'Diagnostics',
        items: [
            {
                name: 'Load time',
                desc: 'How long Tasks took to be ready at the last start of Obsidian. For finding out why dashboards load slowly.',
                render: (setting: Setting) => {
                    setting.descEl.createDiv({
                        text: lastLoadTimeMessage() ?? 'Tasks was not ready yet when this tab was opened.',
                    });
                },
            },
        ],
    };
}
