# pi-sticky-question

An extension for the [Pi coding agent](https://pi.dev) that keeps the question you are reading the answer to **pinned at the top of the transcript** while you scroll.

- Scroll through a long answer → the question that produced it stays visible at the top.
- Scroll up to an earlier answer → the header switches to that earlier question.
- When the question itself is already on screen, the header hides automatically.

Long questions are wrapped to at most 3 lines and truncated with `…`. The header uses your theme's user-message colors.

## How is this different from…

- [pi-sticky-usermessage](https://github.com/pungggi/pi-sticky-usermessage) always shows your **latest** message above the editor. pi-sticky-question follows your **scroll position**: it shows the question behind whatever answer you are currently reading, even far back in the session.
- [pi-sticky-input](https://github.com/MasuRii/pi-sticky-input) keeps the input editor anchored at the bottom. It does not show your question.

## Requirements

- Pi with the **fullscreen TUI** (the header needs Pi's scrollable transcript). Enable it with:
  - `"tuiMode": "fullscreen"` in `~/.pi/agent/settings.json`, or
  - `pi --tui-mode fullscreen` for a single run.

In regular mode the extension loads but stays inactive.

## Install

No npm package needed — Pi installs packages straight from git:

```bash
pi install git:github.com/laspinacristian/pi-sticky-question
```

The HTTPS URL works too:

```bash
pi install https://github.com/laspinacristian/pi-sticky-question
```

Then restart Pi. That's it.

Other options:

```bash
# Pin a specific release (tag)
pi install git:github.com/laspinacristian/pi-sticky-question@v1.0.0

# Install for the current project only (.pi/settings.json)
pi install -l git:github.com/laspinacristian/pi-sticky-question

# Try it for one session without installing
pi -e git:github.com/laspinacristian/pi-sticky-question
```

### Manual install (single file)

The extension is a single file, so you can also drop it into Pi's auto-discovered extensions directory:

```bash
mkdir -p ~/.pi/agent/extensions
curl -fsSL https://raw.githubusercontent.com/laspinacristian/pi-sticky-question/main/extensions/sticky-question.ts \
  -o ~/.pi/agent/extensions/sticky-question.ts
```

## Usage

It is enabled automatically at startup. Toggle it with:

```
/sticky-question
```

## Update / uninstall

```bash
pi update --extensions                                          # pull the latest version
pi remove git:github.com/laspinacristian/pi-sticky-question     # uninstall
```

(Versions pinned with `@<tag>` are not moved by `pi update`.)

## How it works

Pi's fullscreen transcript marks the start and end of every message with OSC 133 escape sequences. The extension renders a non-capturing overlay anchored to the top of the screen and, on every render, looks for the closest user message (identified by the OSC 133 start marker plus the theme's `userMessageBg` background) **above** the first visible row of the transcript's scroll view. Results are cached per content/scroll position, so scrolling stays cheap.

Because it reads Pi's internal layout (`tui.currentLayout.primaryScrollView`), a future Pi release that changes the TUI internals may require an update. Tested with Pi `0.99.1`.

## License

[MIT](LICENSE)
