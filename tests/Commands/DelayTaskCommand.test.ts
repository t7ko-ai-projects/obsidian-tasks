/**
 * t7 fork feature: delay a task without dates. Spec: fork-features/delay-undated-tasks.md
 */
import moment from 'moment';
import type { Editor, Menu } from 'obsidian';
import { addDelayTaskItem, delayTaskLine } from '../../src/Commands/DelayTaskCommand';
import { Menu as MenuMock } from '../__mocks__/obsidian';
import { menuToString } from '../ui/Menus/MenuTestingHelpers';
import { GlobalFilter } from '../../src/Config/GlobalFilter';

window.moment = moment;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-30'));
});

afterEach(() => {
    vi.useRealTimers();
    GlobalFilter.getInstance().reset();
});

describe('delayTaskLine', () => {
    it('adds a start date of tomorrow to a task without dates', () => {
        expect(delayTaskLine('- [ ] buy milk', 'a.md')?.line).toEqual('- [ ] buy milk 🛫 2026-10-31');
    });

    it('is not offered for a task with a date, a done task or a non-task', () => {
        expect(delayTaskLine('- [ ] buy milk 📅 2026-11-01', 'a.md')).toBeNull();
        expect(delayTaskLine('- [ ] buy milk ⏳ 2026-11-01', 'a.md')).toBeNull();
        expect(delayTaskLine('- [x] buy milk', 'a.md')).toBeNull();
        expect(delayTaskLine('buy milk', 'a.md')).toBeNull();
    });
});

describe('addDelayTaskItem', () => {
    function run(line: string, withSubmenu = true) {
        const lines = [line];
        const editor = {
            getCursor: () => ({ line: 0, ch: 0 }),
            getLine: (n: number) => lines[n],
            replaceRange: (text: string) => {
                lines[0] = text;
            },
        } as unknown as Editor;
        const topTitles: string[] = [];
        const submenu = new MenuMock();
        const item = {
            setTitle: (t: string) => (topTitles.push(t), item),
            setIcon: () => item,
            onClick: () => item,
            ...(withSubmenu ? { setSubmenu: () => submenu } : {}),
        };
        const menu = { addItem: (cb: (i: typeof item) => void) => cb(item) } as unknown as Menu;
        addDelayTaskItem(menu, editor, 'a.md');
        return { lines, topTitles, submenu };
    }

    it('adds an item whose submenu is the postpone menu, and its items set the start date', async () => {
        const { lines, topTitles, submenu } = run('- [ ] buy milk');
        expect(topTitles).toEqual(['Delay task']);
        expect(menuToString(submenu)).toContain('Start tomorrow');
        expect(menuToString(submenu)).not.toContain('Remove');

        const inTwoDays = submenu.items.find((i) => String(i.title).startsWith('Start in 2 days'));
        await inTwoDays!.callback(new MouseEvent('click'));
        expect(lines[0]).toEqual('- [ ] buy milk 🛫 2026-11-01');
    });

    it('adds nothing for a dated task', () => {
        expect(run('- [ ] buy milk 📅 2026-11-01').topTitles).toEqual([]);
    });
});
