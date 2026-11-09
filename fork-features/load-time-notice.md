# Load time notice

An optional notice that says how long Tasks took to be ready after Obsidian started, to find out why query blocks, such as a dashboard, load slowly on a phone.

## User-facing behaviour

- Settings > Tasks > **Diagnostics** > **Show load time**, off by default. When on, the first time Tasks' task cache is ready after the plugin loaded, a notice stays for 20 seconds:

  ```text
  Tasks ready 8.3 s after loading (9.5 s after the app page started), 2426 tasks.
  After the page started: workspace ready 3.1 s, metadata resolved 5.0 s.
  Tasks' own startup: began 1.3 s, settings read 1.5 s, done 2.1 s.
  ```

- The first time is from the evaluation of the plugin's code to the first time the cache is ready; the second is from the start of the app's web page, so it includes Obsidian's own start-up. Subtract the first from the second to see how long Obsidian took before Tasks started.
- The last line (added 2026-11-09) gives the times, from the start of the page, of the two events that start Tasks' scan: Obsidian's workspace being ready and the first time its metadata cache resolved. If the scan is fast, `ready` follows the later of the two closely; a long gap means the scan itself is slow, and the time before them is waiting for Obsidian and other plugins.
- A third line (added 2026-11-09) gives when Tasks' own startup (`onload()`) began, when it had read its settings and when it finished, from the start of the page, to tell Tasks' own start-up cost from that of other plugins.
- The notice shows once per start of Obsidian. Turning the setting on later shows nothing until the next start.
- Settings are per device, so turn it on on the phone.

## Requirements

1. With the setting off or missing, nothing is shown.
2. The notice is shown for the first cache update whose state is `Warm`, and for no later one.
3. The task count is the number of tasks in that update, before any query's filters.

## Decisions

- **A notice, not a log line:** the phone has no console. A setting that is off by default keeps it out of normal use.
- **The first ready state only:** Tasks loads the vault twice at start-up (when the workspace is ready and on the first metadata event), so later updates would show a second, smaller time that confuses the first.
- **Timing from outside the cache:** the notice listens to the cache's update event, so the hot file `Cache.ts` is untouched.
