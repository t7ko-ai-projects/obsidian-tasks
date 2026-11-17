import { addIcon } from 'obsidian';
import { StatusType } from '../../Statuses/StatusConfiguration';
import { StatusRegistry } from '../../Statuses/StatusRegistry';
import { MULTI_STEP_MARKER, completeAllSteps } from '../../Task/MultiStepTask';
import { doneStatus } from '../../Task/SplitTask';
import { Task } from '../../Task/Task';
import { MenuDividerInstruction } from './MenuDividerInstruction';
import type { TaskEditingInstruction } from './TaskEditingInstruction';

/**
 * The steps marker 🪜 struck through, as the steps are once the task is done. Obsidian has no such icon, so it is
 * added on first use, in the 100 x 100 box Obsidian wants for added icons.
 */
export const COMPLETE_ALL_STEPS_ICON = 'tasks-t7-complete-all-steps';
const COMPLETE_ALL_STEPS_SVG =
    `<text x="50" y="50" font-size="80" text-anchor="middle" dominant-baseline="central" style="stroke: none; fill: currentColor">${MULTI_STEP_MARKER}</text>` +
    '<line x1="4" y1="52" x2="96" y2="52" style="stroke: currentColor; stroke-width: 9; stroke-linecap: round" />';
let completeAllStepsIconAdded = false;

/**
 * t7 fork feature: an instruction for finishing every open step of a multi-step {@link Task} at once.
 * Spec: `fork-features/multi-step-tasks.md`.
 *
 * The steps are struck through and the task is completed as a toggle to done would: done date, next occurrence of a
 * recurring task, On Completion. The status is the one a toggle gives, if that is a done status.
 */
export class CompleteAllStepsInstruction implements TaskEditingInstruction {
    public apply(task: Task): Task[] {
        const description = completeAllSteps(task.description);
        if (description === null || task.status.type === StatusType.DONE) {
            // Unchanged: return the input task:
            return [task];
        }
        const nextStatus = StatusRegistry.getInstance().getNextStatusOrCreate(task.status);
        const status = nextStatus.type === StatusType.DONE ? nextStatus : doneStatus();
        return new Task({ ...task, description }).handleNewStatusWithRecurrenceInUsersOrder(status);
    }

    public instructionDisplayName(): string {
        return 'Complete all steps';
    }

    public isCheckedForTask(_task: Task): boolean {
        return false;
    }

    public instructionIcon(): string {
        if (!completeAllStepsIconAdded) {
            addIcon(COMPLETE_ALL_STEPS_ICON, COMPLETE_ALL_STEPS_SVG);
            completeAllStepsIconAdded = true;
        }
        return COMPLETE_ALL_STEPS_ICON;
    }
}

/**
 * A separator and `Complete all steps`, if {@link task} is open and has two or more open steps; otherwise nothing.
 */
export function completeAllStepsInstructionsAfterSeparator(task: Task): TaskEditingInstruction[] {
    if (!canCompleteAllSteps(task)) {
        return [];
    }
    return [new MenuDividerInstruction(), new CompleteAllStepsInstruction()];
}

/**
 * Whether `Complete all steps` is offered for {@link task}: it is open and has two or more open steps.
 */
export function canCompleteAllSteps(task: Task): boolean {
    const openTypes = [StatusType.TODO, StatusType.IN_PROGRESS, StatusType.ON_HOLD];
    return openTypes.includes(task.status.type) && completeAllSteps(task.description) !== null;
}
