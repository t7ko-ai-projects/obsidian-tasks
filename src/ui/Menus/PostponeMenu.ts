import { type Menu, type MenuItem, Notice } from 'obsidian';
import type { Moment, unitOfTime } from 'moment/moment';
import type { Task } from '../../Task/Task';
import {
    createFixedDateTask,
    createPostponedTask,
    createTaskWithDateRemoved,
    fixedDateMenuItemTitle,
    getDateFieldToPostponeOrStart,
    hasNoHappensDate,
    postponeMenuItemTitle,
    postponementSuccessMessage,
    removeDateMenuItemTitle,
} from '../../DateTime/Postponer';
import type { HappensDate } from '../../DateTime/DateFieldTypes';
import { TaskEditingMenu, type TaskSaver, defaultTaskSaver } from './TaskEditingMenu';

type NamingFunction = (task: Task, amount: number, timeUnit: unitOfTime.DurationConstructor) => string;

export type PostponingFunction = (
    task: Task,
    dateFieldToPostpone: HappensDate,
    timeUnit: unitOfTime.DurationConstructor,
    amount: number,
) => {
    postponedDate: moment.Moment | null;
    postponedTask: Task;
};

export class PostponeMenu extends TaskEditingMenu {
    constructor(button: HTMLAnchorElement, task: Task, taskSaver: TaskSaver = defaultTaskSaver) {
        super(taskSaver);

        PostponeMenu.addItems(this, button, task, taskSaver);
    }

    /**
     * Add the items of the postpone menu to {@link menu}: also used for a submenu.
     * @param button - the postpone button to disable once a date is saved; none outside query results.
     */
    public static addItems(menu: Menu, button: HTMLAnchorElement | undefined, task: Task, taskSaver: TaskSaver) {
        const postponeMenuItemCallback = (
            button: HTMLAnchorElement | undefined,
            item: MenuItem,
            timeUnit: unitOfTime.DurationConstructor,
            amount: number,
            itemNamingFunction: NamingFunction,
            postponingFunction: PostponingFunction,
        ) => {
            // TODO some of the code below is duplicated in postponeOnClickCallback() and may be refactored
            let isCurrentValue = false;
            const dateFieldToPostpone = getDateFieldToPostponeOrStart(task);
            if (dateFieldToPostpone) {
                const { postponedDate } = postponingFunction(task, dateFieldToPostpone, timeUnit, amount);

                if (task[dateFieldToPostpone]?.isSame(postponedDate, 'day')) {
                    isCurrentValue = true;
                }
            }

            const title = itemNamingFunction(task, amount, timeUnit);

            item.setChecked(isCurrentValue)
                .setTitle(title)
                .onClick(() =>
                    PostponeMenu.postponeOnClickCallback(button, task, amount, timeUnit, postponingFunction, taskSaver),
                );
        };

        const fixedTitle = fixedDateMenuItemTitle;
        const fixedDateFunction = createFixedDateTask;
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 0, fixedTitle, fixedDateFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'day', 1, fixedTitle, fixedDateFunction));

        menu.addSeparator();

        const titlingFunction = postponeMenuItemTitle;
        const postponingFunction = createPostponedTask;
        if (titlingFunction(task, 1, 'day') !== fixedTitle(task, 1, 'day')) {
            menu.addItem((item) =>
                postponeMenuItemCallback(button, item, 'day', 1, titlingFunction, postponingFunction),
            );
        }
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 2, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 3, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 4, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 5, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'days', 6, titlingFunction, postponingFunction));

        menu.addSeparator();

        menu.addItem((item) => postponeMenuItemCallback(button, item, 'week', 1, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'weeks', 2, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'weeks', 3, titlingFunction, postponingFunction));
        menu.addItem((item) => postponeMenuItemCallback(button, item, 'month', 1, titlingFunction, postponingFunction));

        // Nothing to remove from a task without dates.
        if (getDateFieldToPostponeOrStart(task) !== null && !hasNoHappensDate(task)) {
            menu.addSeparator();

            menu.addItem((item) =>
                postponeMenuItemCallback(button, item, 'days', 2, removeDateMenuItemTitle, createTaskWithDateRemoved),
            );
        }
    }

    public static async postponeOnClickCallback(
        button: HTMLAnchorElement | undefined,
        task: Task,
        amount: number,
        timeUnit: unitOfTime.DurationConstructor,
        postponingFunction: PostponingFunction = createPostponedTask,
        taskSaver: TaskSaver = defaultTaskSaver,
    ) {
        const dateFieldToPostpone = getDateFieldToPostponeOrStart(task);
        if (dateFieldToPostpone === null) {
            const errorMessage = '⚠️ Postponement requires a date: due, scheduled or start.';
            return new Notice(errorMessage, 10000);
        }

        const { postponedDate, postponedTask } = postponingFunction(task, dateFieldToPostpone, timeUnit, amount);

        if (task[dateFieldToPostpone]?.isSame(postponedDate, 'day')) {
            return;
        }

        await taskSaver(task, postponedTask);
        PostponeMenu.postponeSuccessCallback(button, dateFieldToPostpone, postponedDate);
    }

    private static postponeSuccessCallback(
        button: HTMLAnchorElement | undefined,
        updatedDateType: HappensDate,
        postponedDate: Moment | null,
    ) {
        // Disable the button to prevent update error due to the task not being reloaded yet.
        // (we cannot use Obsidian's addClass method because it is not available when this code is run in tests.)
        button?.classList.add('tasks-no-pointer-events');

        const successMessage = postponementSuccessMessage(postponedDate, updatedDateType);
        new Notice(successMessage, 2000);
    }
}
