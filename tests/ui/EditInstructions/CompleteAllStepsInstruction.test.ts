/**
 * t7 fork feature: multi-step tasks, complete all steps. Spec: fork-features/multi-step-tasks.md
 */
import moment from 'moment';
import { resetSettings } from '../../../src/Config/Settings';
import { StatusRegistry } from '../../../src/Statuses/StatusRegistry';
import { completeAllSteps } from '../../../src/Task/MultiStepTask';
import {
    CompleteAllStepsInstruction,
    completeAllStepsInstructionsAfterSeparator,
} from '../../../src/ui/EditInstructions/CompleteAllStepsInstruction';
import { StatusMenu } from '../../../src/ui/Menus/StatusMenu';
import { fromLine } from '../../TestingTools/TestHelpers';
import { menuToString } from '../Menus/MenuTestingHelpers';

window.moment = moment;

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02'));
});

afterEach(() => {
    vi.useRealTimers();
    resetSettings();
    StatusRegistry.getInstance().resetToDefaultStatuses();
});

describe('completeAllSteps', () => {
    it('strikes through every open step, keeping the done ones and the tags', () => {
        expect(completeAllSteps('Renew 🪜 ~~form~~ // photo #a // submit')).toEqual(
            'Renew 🪜 ~~form~~ // ~~photo~~ #a // ~~submit~~',
        );
    });

    it('is null with fewer than two open steps or no steps', () => {
        expect(completeAllSteps('Renew 🪜 ~~form~~ // submit')).toBeNull();
        expect(completeAllSteps('Renew 🪜 ~~form~~')).toBeNull();
        expect(completeAllSteps('Renew')).toBeNull();
    });
});

describe('CompleteAllStepsInstruction', () => {
    it('completes the task with all steps struck through and a done date', () => {
        const task = fromLine({ line: '- [ ] Renew 🪜 form // photo // submit 📅 2026-11-05' });
        const result = new CompleteAllStepsInstruction().apply(task);
        expect(result.map((t) => t.toFileLineString())).toEqual([
            '- [x] Renew 🪜 ~~form~~ // ~~photo~~ // ~~submit~~ 📅 2026-11-05 ✅ 2026-11-02',
        ]);
    });

    it('starts the next occurrence of a recurring task at step 1', () => {
        const task = fromLine({ line: '- [ ] Renew 🪜 form // photo 🔁 every day 📅 2026-11-02' });
        const lines = new CompleteAllStepsInstruction().apply(task).map((t) => t.toFileLineString());
        expect(lines).toHaveLength(2);
        expect(lines.some((l) => l.includes('🪜 form // photo') && l.startsWith('- [ ]'))).toBe(true);
        expect(lines.some((l) => l.includes('~~form~~ // ~~photo~~') && l.startsWith('- [x]'))).toBe(true);
    });
});

describe('menu entry', () => {
    it('is offered for an open task with two or more open steps only', () => {
        const entry = (line: string) => completeAllStepsInstructionsAfterSeparator(fromLine({ line })).length;
        expect(entry('- [ ] a 🪜 b // c')).toEqual(2);
        expect(entry('- [/] a 🪜 b // c')).toEqual(2);
        expect(entry('- [ ] a 🪜 ~~b~~ // c')).toEqual(0);
        expect(entry('- [x] a 🪜 b // c')).toEqual(0);
        expect(entry('- [ ] a')).toEqual(0);
    });

    it('ends the status menu', () => {
        const menu = new StatusMenu(StatusRegistry.getInstance(), fromLine({ line: '- [ ] a 🪜 b // c' }));
        const text = menuToString(menu);
        expect(text.trimEnd().endsWith('Complete all steps')).toBe(true);
        expect(menuToString(new StatusMenu(StatusRegistry.getInstance(), fromLine({ line: '- [ ] a' })))).not.toContain(
            'Complete all steps',
        );
    });
});
