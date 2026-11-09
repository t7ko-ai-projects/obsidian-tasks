/**
 * t7 fork feature: load time notice. Spec: fork-features/load-time-notice.md
 */
import { resetSettings, updateSettings } from '../../src/Config/Settings';
import { loadTimeNoticeShown } from '../../src/Config/LoadTimeNoticeSetting';
import { loadTimeMessage } from '../../src/Obsidian/LoadTimeNotice';

afterEach(() => {
    resetSettings();
});

describe('load time notice', () => {
    it('is off by default and follows the saved setting', () => {
        expect(loadTimeNoticeShown()).toEqual(false);
        updateSettings({ t7: { diagnostics: { loadTimeNotice: true } } } as never);
        expect(loadTimeNoticeShown()).toEqual(true);
    });

    it('says the times in seconds and the task count', () => {
        const seen = {
            workspaceReady: 3100,
            metadataResolved: 5000,
            onloadStart: 1300,
            settingsRead: 1500,
            onloadEnd: 2100,
        };
        expect(loadTimeMessage(9500, 2426, seen, 1200)).toEqual(
            'Tasks ready 8.3 s after loading (9.5 s after the app page started), 2426 tasks. ' +
                'After the page started: workspace ready 3.1 s, metadata resolved 5.0 s. ' +
                "Tasks' own startup: began 1.3 s, settings read 1.5 s, done 2.1 s.",
        );
        expect(loadTimeMessage(9500, 1, undefined, 1200)).toContain(
            'workspace ready not yet, metadata resolved not yet',
        );
    });
});
