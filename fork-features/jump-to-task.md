# Jump to

`Jump to` at the top of the context menu of a rendered task opens the task's note at the task's line, so it can be edited there.

## User-facing behaviour

- Right-click (long-press on a phone) a rendered task's text in query results or Reading mode: the menu, the one with `Add nail`, starts with `Jump to`, followed by a separator.
- Choosing it opens the task's note in the current tab, with the cursor on the task's line, in the note's usual mode (Live Preview, Source mode or Reading mode). Use the back arrow to return to the query.
- It does what a click on the task's backlink (the note's name after the task) does, without a modifier key. To open the note in a new tab, use the backlink with Ctrl or a middle click.
- A task whose note has no known path (a task in a canvas card, say) has no menu at all, as before.
- If the task is no longer where Tasks found it (the note changed), a notice says so and nothing opens.
- There is no setting.

## Requirements

1. `Jump to` is the first item of the nail menu, followed by a separator, whenever the plugin has registered the app.
2. Choosing it finds the task's line with the same search as a click on the backlink (`getTaskLineAndFile`) and opens the file with `eState.line` set, in the current tab (`getLeaf(false)`).
3. Nothing is opened when the line isn't found.

## Decisions

- **In the nail menu:** it is the menu of a right-click on a task's text. The checkbox, dates, priority and horizon have their own menus, which are about editing those fields.
- **At the top:** the user wants it often; the other items change a task and come after it.
- **Same tab:** like a click on the backlink, so it behaves the same everywhere. A modifier key can't be pressed on a menu item.
- **The note's own mode:** the user wants to edit the line directly. Forcing Live Preview would change the note's view state; the backlink doesn't either.
- **Not in the editor menu:** the editor is already in the note.
