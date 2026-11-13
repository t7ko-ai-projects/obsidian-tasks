import type { Task } from '../../Task/Task';
import { nailInstructions, nailInstructionsAfterSeparator } from '../EditInstructions/NailInstructions';
import { splitTaskInstructionsAfterSeparator } from '../EditInstructions/SplitTaskInstruction';
import { completePermanentlyInstructionsAfterSeparator } from '../EditInstructions/CompletePermanentlyInstruction';
import { jumpToTask, jumpToTaskAvailable } from '../../Obsidian/JumpToTask';
import { PriorityMenu } from './PriorityMenu';
import { TaskEditingMenu, type TaskSaver, defaultTaskSaver } from './TaskEditingMenu';

/**
 * t7 fork feature: a Menu for adding or removing a Task's nails. Spec: `fork-features/nails.md`.
 *
 * It is the menu of a right-click on a rendered task's text, so it also ends with `Split task` when the task can be
 * split (t7 fork feature: split tasks, spec: `fork-features/split-tasks.md`), and with `Complete permanently` when
 * it recurs (t7 fork feature: complete permanently, spec: `fork-features/complete-permanently.md`). It starts with
 * `Jump to`, which opens the task's note at its line (t7 fork feature: jump to task, spec:
 * `fork-features/jump-to-task.md`).
 */
export class NailMenu extends TaskEditingMenu {
    /**
     * Constructor, which sets up the menu items.
     * @param task - the Task to be edited.
     * @param taskSaver - an optional {@link TaskSaver} function. For details, see {@link TaskEditingMenu}.
     */
    constructor(task: Task, taskSaver: TaskSaver = defaultTaskSaver) {
        super(taskSaver);

        if (jumpToTaskAvailable()) {
            this.addItem((item) => item.setTitle('Jump to').onClick(() => jumpToTask(task)));
            this.addSeparator();
        }
        this.addItemsForInstructions(nailInstructions(task), task);
        this.addItemsForInstructions(splitTaskInstructionsAfterSeparator(task), task);
        this.addItemsForInstructions(completePermanentlyInstructionsAfterSeparator(task), task);
    }
}

/**
 * t7 fork feature: upstream's {@link PriorityMenu}, ending with a separator and the nail items.
 * Spec: `fork-features/nails.md`.
 */
export class PriorityMenuWithNails extends PriorityMenu {
    constructor(task: Task, taskSaver: TaskSaver = defaultTaskSaver) {
        super(task, taskSaver);

        this.addItemsForInstructions(nailInstructionsAfterSeparator(task), task);
    }
}
