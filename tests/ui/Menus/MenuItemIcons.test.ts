import moment from 'moment';
import type { App } from 'obsidian';
import type { MenuItem } from '../../__mocks__/obsidian';
import { registerJumpToTask } from '../../../src/Obsidian/JumpToTask';
import { StatusRegistry } from '../../../src/Statuses/StatusRegistry';
import { NailMenu, PriorityMenuWithNails } from '../../../src/ui/Menus/NailMenu';
import { StatusMenu } from '../../../src/ui/Menus/StatusMenu';
import { fromLine } from '../../TestingTools/TestHelpers';

window.moment = moment;

/**
 * t7 fork features: icons for the fork's menu items in the menus of rendered tasks and checkboxes.
 */

function iconsByTitle(menu: object): Record<string, string> {
    // @ts-expect-error TS2339: Property 'items' does not exist on the real Menu.
    const items: MenuItem[] = menu.items;
    return Object.fromEntries(items.filter((item) => item.title !== '---').map((item) => [item.title, item.icon]));
}

describe('menu item icons', () => {
    it('should show the nail icon on the nail items', () => {
        const menu = new NailMenu(fromLine({ line: '- [ ] ⚠️ fix' }));

        expect(iconsByTitle(menu)).toEqual({ 'Add nail': 'triangle-alert', 'Remove nail': 'triangle-alert' });
    });

    it('should show the nail icon at the end of the priority menu', () => {
        const icons = iconsByTitle(new PriorityMenuWithNails(fromLine({ line: '- [ ] fix' })));

        expect(icons['Add nail']).toEqual('triangle-alert');
        // Upstream's priority items have none.
        expect(Object.values(icons).filter((icon) => icon === '').length).toBeGreaterThan(0);
    });

    it('should show the split icon on Split task', () => {
        const menu = new NailMenu(fromLine({ line: '- [ ] fix // test' }));

        expect(iconsByTitle(menu)['Split task']).toEqual('split');
    });

    it('should show the double check mark on Complete permanently', () => {
        const task = fromLine({ line: '- [ ] water 🔁 every day 📅 2026-11-16' });

        expect(iconsByTitle(new NailMenu(task))['Complete permanently']).toEqual('check-check');
        expect(iconsByTitle(new StatusMenu(new StatusRegistry(), task))['Complete permanently']).toEqual('check-check');
    });

    it('should show an icon on Complete all steps, but not on the statuses', () => {
        const task = fromLine({ line: '- [ ] Renew 🪜 form // photo' });

        expect(iconsByTitle(new NailMenu(task))['Complete all steps']).toEqual('tasks-t7-complete-all-steps');
        expect(iconsByTitle(new StatusMenu(new StatusRegistry(), task))).toEqual({
            'Change status to: [ ] Todo': '',
            'Change status to: [x] Done': '',
            'Change status to: [/] In Progress': '',
            'Change status to: [-] Cancelled': '',
            'Complete all steps': 'tasks-t7-complete-all-steps',
        });
    });

    it('should show an arrow on Jump to', () => {
        registerJumpToTask({} as App);
        try {
            expect(iconsByTitle(new NailMenu(fromLine({ line: '- [ ] fix' })))['Jump to']).toEqual('arrow-right');
        } finally {
            registerJumpToTask(undefined);
        }
    });
});
