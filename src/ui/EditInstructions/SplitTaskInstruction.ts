import type { Task } from '../../Task/Task';
import { splitDescription, splitTask } from '../../Task/SplitTask';
import { MenuDividerInstruction } from './MenuDividerInstruction';
import type { TaskEditingInstruction } from './TaskEditingInstruction';

// Lucide's split arrow, which Obsidian has.
export const SPLIT_ICON = 'split';

/**
 * t7 fork feature: an instruction for splitting a {@link Task} at its `//` separators.
 * Spec: `fork-features/split-tasks.md`.
 */
export class SplitTaskInstruction implements TaskEditingInstruction {
    public apply(task: Task): Task[] {
        // Unchanged: return the input task:
        return splitTask(task) ?? [task];
    }

    public instructionDisplayName(): string {
        return 'Split task';
    }

    public isCheckedForTask(_task: Task): boolean {
        return false;
    }

    public instructionIcon(): string {
        return SPLIT_ICON;
    }
}

/**
 * A separator and `Split task`, if {@link task} can be split; otherwise nothing.
 */
export function splitTaskInstructionsAfterSeparator(task: Task): TaskEditingInstruction[] {
    if (splitDescription(task.description) === null) {
        return [];
    }
    return [new MenuDividerInstruction(), new SplitTaskInstruction()];
}
