import { StatusType } from '../../Statuses/StatusConfiguration';
import { StatusRegistry } from '../../Statuses/StatusRegistry';
import { completeAllSteps } from '../../Task/MultiStepTask';
import { doneStatus } from '../../Task/SplitTask';
import { Task } from '../../Task/Task';
import { MenuDividerInstruction } from './MenuDividerInstruction';
import type { TaskEditingInstruction } from './TaskEditingInstruction';

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
}

/**
 * A separator and `Complete all steps`, if {@link task} is open and has two or more open steps; otherwise nothing.
 */
export function completeAllStepsInstructionsAfterSeparator(task: Task): TaskEditingInstruction[] {
    const openTypes = [StatusType.TODO, StatusType.IN_PROGRESS, StatusType.ON_HOLD];
    if (!openTypes.includes(task.status.type) || completeAllSteps(task.description) === null) {
        return [];
    }
    return [new MenuDividerInstruction(), new CompleteAllStepsInstruction()];
}
