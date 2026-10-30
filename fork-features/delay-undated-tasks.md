# Delay a task without dates

The delay (postpone) button of a rendered task is also there for a task with no start, scheduled or due date. Using it adds a start date. The editor has the same action in its context menu and as a command.

## User-facing behaviour

- **Rendered tasks** (query results, Reading mode): a not done task with no start, scheduled and due date gets the delay button. A click sets its start date (🛫) to tomorrow. Its right-click menu is the usual one (`Start today`, `Start tomorrow`, `Start in 2 days` ... `Start in a month`), all setting the start date from today; it has no `Remove ...` item, as there is no date to remove.
- **Editor** (Live Preview and Source mode): the context menu of a task line, and the command `Delay task` (command palette, under Tasks; a hotkey can be set), offer `Delay task` for such a task. In the menu it opens a submenu with the items of the delay button's right-click menu (`Start today`, `Start tomorrow`, ...), each setting the start date. The command adds `🛫 <tomorrow>` to the line. There is no menu entry for other tasks: they have dates, and the date menu of the editor (a right-click on a date) does the job.
- A task with any of the three dates behaves as before. Done tasks never get the button or the item.
- The `postpone.dateField` setting (due, scheduled, start and their orders) still decides which date of a dated task moves. For a task without dates the start date is used whatever the setting says.
- A task with only a created, done or cancelled date counts as having no dates.
- Hiding the button with `hide postpone button` hides it here too.

## Requirements

- `shouldShowPostponeButton` is true for a not done task whose three dates are all empty, and still false if any date is invalid.
- Postponing from no date counts from today, so one day gives tomorrow.
- A task with a start date that the `dateField` setting excludes (for example `due` only) still has no button, as before.

## Decisions

- **Start date, not due:** the user asked for it. A start date puts the task off without making it look overdue, which is what delaying means.
- **Tomorrow:** the same as the button's one day; a click then always moves the task one day on from today, as for a task due today or earlier.
- **No `Remove` item:** it would do nothing.
- **A separate editor command, not the date menu:** an undated task has no date to right-click.
