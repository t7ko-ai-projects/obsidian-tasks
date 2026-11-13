/**
 * t7 fork feature: jump to task. Spec: fork-features/jump-to-task.md
 */
import type { App } from 'obsidian';
import { jumpToTask, jumpToTaskAvailable, registerJumpToTask } from '../../src/Obsidian/JumpToTask';
import { NailMenu } from '../../src/ui/Menus/NailMenu';
import { fromLine } from '../TestingTools/TestHelpers';
import { TestableTaskSaver, menuToString } from '../ui/Menus/MenuTestingHelpers';

const getTaskLineAndFile = vi.fn();
vi.mock('../../src/Obsidian/File', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../../src/Obsidian/File')>()),
    getTaskLineAndFile: (...args: unknown[]) => getTaskLineAndFile(...args),
}));

afterEach(() => {
    registerJumpToTask(undefined);
    getTaskLineAndFile.mockReset();
});

function fakeApp() {
    const openFile = vi.fn();
    const getLeaf = vi.fn(() => ({ openFile }));
    const app = { vault: {}, workspace: { getLeaf } } as unknown as App;
    return { app, openFile, getLeaf };
}

describe('jump to task', () => {
    it('is unavailable until the app is registered', async () => {
        expect(jumpToTaskAvailable()).toEqual(false);
        await jumpToTask(fromLine({ line: '- [ ] Call Bob' }));
        expect(getTaskLineAndFile).not.toHaveBeenCalled();
    });

    it('opens the note in the current tab at the task line', async () => {
        const { app, openFile, getLeaf } = fakeApp();
        registerJumpToTask(app);
        const file = { path: 'a.md' };
        getTaskLineAndFile.mockResolvedValue([7, file]);

        await jumpToTask(fromLine({ line: '- [ ] Call Bob' }));

        expect(getLeaf).toHaveBeenCalledWith(false);
        expect(openFile).toHaveBeenCalledWith(file, { eState: { line: 7 } });
    });

    it('opens nothing when the task line is not found', async () => {
        const { app, openFile } = fakeApp();
        registerJumpToTask(app);
        getTaskLineAndFile.mockResolvedValue(undefined);

        await jumpToTask(fromLine({ line: '- [ ] Call Bob' }));

        expect(openFile).not.toHaveBeenCalled();
    });
});

describe('Jump to in the nail menu', () => {
    const menuOf = () => new NailMenu(fromLine({ line: '- [ ] Call Bob' }), TestableTaskSaver.testableTaskSaver);

    it('starts the menu, followed by a separator, once the app is registered', () => {
        registerJumpToTask(fakeApp().app);
        const lines = menuToString(menuOf()).trim().split('\n');
        expect(lines[0].trim()).toEqual('Jump to');
        expect(lines[1].trim()).toEqual('---');
    });

    it('is not in the menu before that', () => {
        expect(menuToString(menuOf())).not.toContain('Jump to');
    });
});
