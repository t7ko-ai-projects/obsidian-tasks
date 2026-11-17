import moment from 'moment';
import type { MenuItem } from '../../__mocks__/obsidian';
import { NailMenu, PriorityMenuWithNails } from '../../../src/ui/Menus/NailMenu';
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
});
