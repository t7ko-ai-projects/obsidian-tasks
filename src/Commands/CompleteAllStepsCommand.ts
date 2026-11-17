import type { Editor, MarkdownFileInfo, MarkdownView, Menu, Plugin } from 'obsidian';
import { TasksFile } from '../Scripting/TasksFile';
import { Task } from '../Task/Task';
import { TaskLocation } from '../Task/TaskLocation';
import {
    COMPLETE_ALL_STEPS_ICON,
    CompleteAllStepsInstruction,
    canCompleteAllSteps,
} from '../ui/EditInstructions/CompleteAllStepsInstruction';

/**
 * t7 fork feature: multi-step tasks. Spec: `fork-features/multi-step-tasks.md`.
 *
 * The editor command `Complete all steps` for the multi-step task on the cursor's line, and the same item in the
 * editor's context menu (Live Preview and Source mode). Call once from the plugin's `onload()`.
 */
export function registerCompleteAllStepsCommand(plugin: Plugin): void {
    plugin.addCommand({
        id: 'complete-all-steps',
        name: 'Complete all steps',
        // Also adds the icon to Obsidian, before anything shows it.
        icon: new CompleteAllStepsInstruction().instructionIcon(),
        editorCheckCallback: (checking: boolean, editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
            const lineNumber = editor.getCursor().line;
            const line = completeAllStepsLine(editor.getLine(lineNumber), ctx.file?.path ?? '');
            if (checking || line === null) {
                return line !== null;
            }
            replaceLine(editor, lineNumber, line);
            return true;
        },
    });

    plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) =>
            addCompleteAllStepsItem(menu, editor, info.file?.path ?? ''),
        ),
    );
}

/**
 * The text that replaces the task on {@link line} once all its steps are complete: the done task and, for a recurring
 * task, its next occurrence, on separate lines in the user's order. Null if it is not a task or the item is not
 * offered for it.
 */
export function completeAllStepsLine(line: string, path: string): string | null {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: null,
    });
    if (task === null || !canCompleteAllSteps(task)) {
        return null;
    }
    return new CompleteAllStepsInstruction()
        .apply(task)
        .map((t) => t.toFileLineString())
        .join('\n');
}

/**
 * Add `Complete all steps` to an editor's context menu, when the cursor is on an open task line with two or more
 * open steps. A right-click puts the cursor where it clicks, unless it clicks inside the selection.
 */
export function addCompleteAllStepsItem(menu: Menu, editor: Editor, path: string): void {
    const lineNumber = editor.getCursor().line;
    if (completeAllStepsLine(editor.getLine(lineNumber), path) === null) {
        return;
    }
    menu.addItem((item) =>
        item
            .setTitle('Complete all steps')
            .setIcon(COMPLETE_ALL_STEPS_ICON)
            .onClick(() => {
                // Work out the change from the line as it is now.
                const line = completeAllStepsLine(editor.getLine(lineNumber), path);
                if (line !== null) {
                    replaceLine(editor, lineNumber, line);
                }
            }),
    );
}

function replaceLine(editor: Editor, lineNumber: number, line: string): void {
    const end = editor.getLine(lineNumber).length;
    editor.replaceRange(line, { line: lineNumber, ch: 0 }, { line: lineNumber, ch: end });
}
