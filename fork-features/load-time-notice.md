# Load time

A line in Tasks' settings that says how long Tasks took to be ready at the last start of Obsidian, to find out why query blocks, such as a dashboard, load slowly on a phone. It started as a popup notice (2026-11-09) and became a settings line on 2026-11-13, as the user wanted no popup.

## User-facing behaviour

- Settings > Tasks > **Diagnostics** > **Load time** shows, for the last start of Obsidian on this device:

  ```text
  Tasks ready 8.3 s after loading (9.5 s after the app page started), 2426 tasks.
  After the page started: workspace ready 3.1 s, metadata resolved 5.0 s.
  Tasks' own startup: began 1.3 s, settings read 1.5 s, done 2.1 s.
  ```

- The first time is from the evaluation of the plugin's code to the first time the cache is ready; the second is from the start of the app's web page, so it includes Obsidian's own start-up. Subtract the first from the second to see how long Obsidian took before Tasks started.
- The second line gives the times, from the start of the page, of the two events that start Tasks' scan: Obsidian's workspace being ready and the first time its metadata cache resolved. If the scan is fast, `ready` follows the later of the two closely; a long gap means the scan itself is slow, and the time before them is waiting for Obsidian and other plugins.
- The third line gives when Tasks' own startup (`onload()`) began, when it had read its settings and when it finished, from the start of the page, to tell Tasks' own start-up cost from that of other plugins.
- Nothing pops up, and there is no setting for it. If the settings tab is opened before Tasks is ready, the line says so.
- The line is per device: it is the phone's own start-up on the phone.

## Requirements

1. The line is recorded for the first cache update whose state is `Warm`, and for no later one.
2. The task count is the number of tasks in that update, before any query's filters.
3. Recording costs a few clock reads at start-up and writes nothing to disk.

## Decisions

- **A settings line, not a popup (2026-11-13):** the user wanted the popup gone but the numbers kept. The phone has no console, so the settings tab is where they can still be read.
- **No setting to turn it on:** with nothing popping up, there is nothing to turn off.
- **The first ready state only:** Tasks loads the vault twice at start-up (when the workspace is ready and on the first metadata event), so later updates would show a second, smaller time that confuses the first.
- **Timing from outside the cache:** it listens to the cache's update event, so the hot file `Cache.ts` is untouched.
