/**
 * t7 fork feature: multi-step tasks, `Complete all steps` outside the status menu. Spec: fork-features/multi-step-tasks.md
 */
import moment from 'moment';
import type { Editor, Menu, Plugin } from 'obsidian';
import {
    addCompleteAllStepsItem,
    completeAllStepsLine,
    registerCompleteAllStepsCommand,
} from '../../src/Commands/CompleteAllStepsCommand';
import { GlobalFilter } from '../../src/Config/GlobalFilter';
import { resetSettings } from '../../src/Config/Settings';
import { NailMenu } from '../../src/ui/Menus/NailMenu';
import { fromLine } from '../TestingTools/TestHelpers';
import { TestableTaskSaver, menuToString } from '../ui/Menus/MenuTestingHelpers';

window.moment = moment;

const steps = '- [ ] Renew passport 🪜 ~~fill form~~ // get photo // submit 📅 2026-10-30';
const done = '- [x] Renew passport 🪜 ~~fill form~~ // ~~get photo~~ // ~~submit~~ 📅 2026-10-30 ✅ 2026-11-17';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-17'));
    TestableTaskSaver.reset();
});

afterEach(() => {
    vi.useRealTimers();
    resetSettings();
    GlobalFilter.getInstance().reset();
});

/**
 * An editor holding {@link lines}, with the cursor on line {@link cursorLine}; replaceRange() edits the lines.
 */
function fakeEditor(lines: string[], cursorLine = 0) {
    const editor = {
        getCursor: () => ({ line: cursorLine, ch: 0 }),
        getLine: (n: number) => lines[n],
        replaceRange: (text: string, from: { line: number; ch: number }, to: { line: number; ch: number }) => {
            const line = lines[from.line];
            lines.splice(from.line, 1, ...(line.slice(0, from.ch) + text + line.slice(to.ch)).split('\n'));
        },
    };
    return { editor: editor as unknown as Editor, lines };
}

interface FakeItem {
    title: string;
    icon: string;
    callback: () => void;
}

function fakeMenu() {
    const items: FakeItem[] = [];
    const menu = {
        addItem: (cb: (item: unknown) => void) => {
            const item: FakeItem = { title: '', icon: '', callback: () => {} };
            const builder = {
                setTitle: (title: string) => ((item.title = title), builder),
                setIcon: (icon: string) => ((item.icon = icon), builder),
                onClick: (callback: () => void) => ((item.callback = callback), builder),
            };
            cb(builder);
            items.push(item);
            return menu;
        },
    };
    return { menu: menu as unknown as Menu, items };
}

describe('completeAllStepsLine', () => {
    it('should strike all open steps and complete the task', () => {
        expect(completeAllStepsLine(steps, 'a.md')).toEqual(done);
    });

    it('should add the next occurrence of a recurring task, starting at step 1', () => {
        expect(completeAllStepsLine('    - [ ] Bake 🪜 mix // bake 🔁 every day 📅 2026-11-17', 'a.md')).toEqual(
            '    - [ ] Bake 🪜 mix // bake 🔁 every day 📅 2026-11-18\n' +
                '    - [x] Bake 🪜 ~~mix~~ // ~~bake~~ 🔁 every day 📅 2026-11-17 ✅ 2026-11-17',
        );
    });

    it.each([
        '- [ ] Call Bob',
        '- [ ] Renew 🪜 ~~form~~ // photo',
        '- [x] Renew 🪜 form // photo',
        '- [-] Renew 🪜 form // photo',
        '- Renew 🪜 form // photo',
        '',
    ])('should not offer it for "%s"', (line: string) => {
        expect(completeAllStepsLine(line, 'a.md')).toBeNull();
    });

    it('should not offer it for a checkbox without the global filter', () => {
        GlobalFilter.getInstance().set('#task');
        expect(completeAllStepsLine(steps, 'a.md')).toBeNull();
    });
});

describe('Complete all steps in the editor menu', () => {
    it('should offer nothing on a task without two open steps', () => {
        const { menu, items } = fakeMenu();
        addCompleteAllStepsItem(menu, fakeEditor(['- [ ] Call Bob']).editor, 'a.md');

        expect(items).toEqual([]);
    });

    it('should replace the line with the cursor', () => {
        const { menu, items } = fakeMenu();
        const { editor, lines } = fakeEditor(['# Heading', steps, 'next'], 1);
        addCompleteAllStepsItem(menu, editor, 'a.md');

        expect(items.map((item) => [item.title, item.icon])).toEqual([
            ['Complete all steps', 'tasks-t7-complete-all-steps'],
        ]);
        items[0].callback();
        expect(lines).toEqual(['# Heading', done, 'next']);
    });
});

describe('Complete all steps command', () => {
    function registeredCommand() {
        let command: any;
        const plugin = {
            addCommand: (c: unknown) => (command = c),
            registerEvent: () => {},
            app: { workspace: { on: () => ({}) } },
        };
        registerCompleteAllStepsCommand(plugin as unknown as Plugin);
        return command;
    }

    it('should be offered only on a task with two or more open steps', () => {
        const command = registeredCommand();
        const ctx = { file: { path: 'a.md' } };

        expect(command.id).toEqual('complete-all-steps');
        expect(command.name).toEqual('Complete all steps');
        expect(command.icon).toEqual('tasks-t7-complete-all-steps');
        expect(command.editorCheckCallback(true, fakeEditor(['- [ ] Call Bob']).editor, ctx)).toEqual(false);
        expect(command.editorCheckCallback(true, fakeEditor([steps]).editor, ctx)).toEqual(true);
    });

    it('should complete the task on the cursor line', () => {
        const command = registeredCommand();
        const { editor, lines } = fakeEditor(['a', steps], 1);

        command.editorCheckCallback(false, editor, { file: null });
        expect(lines).toEqual(['a', done]);
    });
});

describe('Complete all steps in the rendered task menu', () => {
    it('should not be offered for a task with one open step', () => {
        const menu = new NailMenu(fromLine({ line: '- [ ] Renew 🪜 ~~form~~ // photo' }));

        expect(menuToString(menu)).not.toContain('Complete all steps');
    });

    it('should end the menu and save the completed task', async () => {
        const task = fromLine({ line: steps });
        const menu = new NailMenu(task, TestableTaskSaver.testableTaskSaver);
        expect(menuToString(menu)).toMatchInlineSnapshot(`
          "
            Add nail
            ---
            Split task
            ---
            Complete all steps"
        `);

        // @ts-expect-error TS2339: Property 'items' does not exist on type 'Menu'.
        await menu.items.find((i: { title: string }) => i.title === 'Complete all steps').callback();

        expect(TestableTaskSaver.taskBeingOverwritten).toBe(task);
        expect(TestableTaskSaver.tasksBeingSaved?.map((t) => t.toFileLineString())).toEqual([done]);
    });
});
