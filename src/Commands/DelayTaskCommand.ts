import type { Editor, MarkdownFileInfo, MarkdownView, Menu, Plugin } from 'obsidian';
import { createPostponedTask, hasNoHappensDate, postponeMenuItemTitle } from '../DateTime/Postponer';
import { TasksFile } from '../Scripting/TasksFile';
import { Task } from '../Task/Task';
import { TaskLocation } from '../Task/TaskLocation';
import { PostponeMenu } from '../ui/Menus/PostponeMenu';
import type { TaskSaver } from '../ui/Menus/TaskEditingMenu';

/**
 * t7 fork feature: delay a task without dates. Spec: `fork-features/delay-undated-tasks.md`.
 *
 * The editor command `Delay task` for a not done task without start, scheduled and due dates on the cursor's line,
 * and the same item in the editor's context menu (Live Preview and Source mode). It adds a start date of tomorrow,
 * as the delay button of rendered tasks does. Call once from the plugin's `onload()`.
 */
export function registerDelayTaskCommand(plugin: Plugin): void {
    plugin.addCommand({
        id: 'delay-task',
        name: 'Delay task',
        icon: DELAY_ICON,
        editorCheckCallback: (checking: boolean, editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
            const lineNumber = editor.getCursor().line;
            const delayed = delayTaskLine(editor.getLine(lineNumber), ctx.file?.path ?? '');
            if (checking || delayed === null) {
                return delayed !== null;
            }
            replaceLine(editor, lineNumber, delayed.line);
            return true;
        },
    });

    plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) =>
            addDelayTaskItem(menu, editor, info.file?.path ?? ''),
        ),
    );
}

// Lucide's clock, which Obsidian has.
const DELAY_ICON = 'clock';

function delayableTask(line: string, path: string): Task | null {
    const task = Task.fromLine({
        line,
        taskLocation: TaskLocation.fromUnknownPosition(new TasksFile(path)),
        fallbackDate: null,
    });
    return task === null || task.isDone || !hasNoHappensDate(task) ? null : task;
}

/**
 * The line of the task on {@link line} with a start date of tomorrow, and the menu title for it; null if the line is
 * not a task, is done, or has a start, scheduled or due date.
 */
export function delayTaskLine(line: string, path: string): { line: string; title: string } | null {
    const task = delayableTask(line, path);
    if (task === null) {
        return null;
    }
    const { postponedTask } = createPostponedTask(task, 'startDate', 'day', 1);
    return { line: postponedTask.toFileLineString(), title: postponeMenuItemTitle(task, 1, 'day') };
}

/**
 * Add `Delay task` to an editor's context menu, when the cursor is on a task line that can be delayed. Its submenu is
 * the menu of the postpone button in query results. A right-click puts the cursor where it clicks, unless it clicks
 * inside the selection.
 */
export function addDelayTaskItem(menu: Menu, editor: Editor, path: string): void {
    const lineNumber = editor.getCursor().line;
    const lineText = editor.getLine(lineNumber);
    const task = delayableTask(lineText, path);
    if (task === null) {
        return;
    }
    const taskSaver: TaskSaver = async (originalTask, newTasks) => {
        const tasks = Array.isArray(newTasks) ? newTasks : [newTasks];
        // Only change the line the menu was opened for.
        if (editor.getLine(lineNumber) === lineText && tasks.length === 1 && tasks[0] !== originalTask) {
            replaceLine(editor, lineNumber, tasks[0].toFileLineString());
        }
    };
    menu.addItem((item) => {
        item.setTitle('Delay task').setIcon(DELAY_ICON);
        // Obsidian's submenu API is not in its typings. Without it, the click delays by a day.
        const submenu = (item as unknown as { setSubmenu?: () => Menu }).setSubmenu?.();
        if (submenu) {
            PostponeMenu.addItems(submenu, undefined, task, taskSaver);
        } else {
            item.onClick(() => PostponeMenu.postponeOnClickCallback(undefined, task, 1, 'day', undefined, taskSaver));
        }
    });
}

function replaceLine(editor: Editor, lineNumber: number, line: string): void {
    const end = editor.getLine(lineNumber).length;
    editor.replaceRange(line, { line: lineNumber, ch: 0 }, { line: lineNumber, ch: end });
}
