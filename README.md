# pi-sticky-prompt

An extension for the [Pi coding agent](https://pi.dev) that keeps the prompt you are reading the answer to **pinned at the top of the transcript** while you scroll.

- Scroll through a long answer → the prompt that produced it stays visible at the top.
- Scroll up to an earlier answer → the header switches to that earlier prompt.
- When the prompt itself is already on screen, the header hides automatically.

Long prompts are wrapped to at most 3 lines and truncated with `…`. The header uses your theme's user-message colors.

## Requirements

- Pi with the **fullscreen TUI** (the header needs Pi's scrollable transcript). Enable it with:
  - `"tuiMode": "fullscreen"` in `~/.pi/agent/settings.json`, or
  - `pi --tui-mode fullscreen` for a single run.

In regular mode the extension loads but stays inactive.

## Install

No npm package needed — Pi installs packages straight from git:

```bash
pi install git:github.com/laspinacristian/pi-sticky-prompt
```

The HTTPS URL works too:

```bash
pi install https://github.com/laspinacristian/pi-sticky-prompt
```

Then restart Pi. That's it.

Other options:

```bash
# Pin a specific release (tag)
pi install git:github.com/laspinacristian/pi-sticky-prompt@v1.0.0

# Install for the current project only (.pi/settings.json)
pi install -l git:github.com/laspinacristian/pi-sticky-prompt

# Try it for one session without installing
pi -e git:github.com/laspinacristian/pi-sticky-prompt
```

### Manual install (single file)

The extension is a single file, so you can also drop it into Pi's auto-discovered extensions directory:

```bash
mkdir -p ~/.pi/agent/extensions
curl -fsSL https://raw.githubusercontent.com/laspinacristian/pi-sticky-prompt/main/extensions/sticky-prompt.ts \
  -o ~/.pi/agent/extensions/sticky-prompt.ts
```

## Usage

It is enabled automatically at startup. Toggle it with:

```
/sticky-prompt
```

## Update / uninstall

```bash
pi update --extensions                                        # pull the latest version
pi remove git:github.com/laspinacristian/pi-sticky-prompt     # uninstall
```

(Versions pinned with `@<tag>` are not moved by `pi update`.)

## How it works

Pi's fullscreen transcript marks the start and end of every message with OSC 133 escape sequences. The extension renders a non-capturing overlay anchored to the top of the screen and, on every render, looks for the closest user message (identified by the OSC 133 start marker plus the theme's `userMessageBg` background) **above** the first visible row of the transcript's scroll view. Results are cached per content/scroll position, so scrolling stays cheap.

Because it reads Pi's internal layout (`tui.currentLayout.primaryScrollView`), a future Pi release that changes the TUI internals may require an update. Tested with Pi `0.99.1`.

## License

[MIT](LICENSE)
