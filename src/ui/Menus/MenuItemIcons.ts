import type { MenuItem } from 'obsidian';
import type { TaskEditingInstruction } from '../EditInstructions/TaskEditingInstruction';

/**
 * t7 fork features: icons for the fork's items in the menus of rendered tasks and checkboxes, the same icons as the
 * items' editor-menu twins. Specs: the features' own (`fork-features/nails.md` and others).
 *
 * An instruction shows an icon when it has an `instructionIcon()` method returning an Obsidian icon id. Upstream's
 * {@link TaskEditingInstruction} interface is left as it is.
 */
export interface InstructionWithIcon {
    instructionIcon(): string;
}

function hasIcon(instruction: TaskEditingInstruction): instruction is TaskEditingInstruction & InstructionWithIcon {
    return typeof (instruction as Partial<InstructionWithIcon>).instructionIcon === 'function';
}

/**
 * Give {@link item} the icon of {@link instruction}, if it has one.
 */
export function setInstructionIcon(item: MenuItem, instruction: TaskEditingInstruction): void {
    if (hasIcon(instruction)) {
        item.setIcon(instruction.instructionIcon());
    }
}
