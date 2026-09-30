/**
 * sticky-question — a "sticky" header showing the current question (fullscreen mode only).
 *
 * While you scroll through the conversation, the question that the answer you are
 * reading belongs to is pinned at the top of the transcript. Scroll up to the answer
 * of an earlier question and the header switches to that question.
 * When the question itself is already visible at the top of the screen, the header hides.
 *
 * Command: /sticky-question → toggle on/off
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

const MAX_LINES = 3; // maximum number of question lines in the header

// OSC 133 markers that Pi adds at the start/end of every message (user and assistant)
const OSC133_START = /^(?:\x1b\]133;[ABC](?:\x07|\x1b\\))*\x1b\]133;A(?:\x07|\x1b\\)/;
const OSC133_END = /\x1b\]133;B(?:\x07|\x1b\\)/;
const ANSI = /\x1b\[[0-9;:?]*[ -\/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]/g;

const strip = (s: string) => s.replace(ANSI, "");

interface LayoutBox {
	rect: { x: number; y: number; width: number; height: number };
	children: LayoutBox[];
	scrollView?: unknown;
	scrollContentLines?: readonly string[];
}

/** Finds the transcript box (the primary scroll view) in Pi's current layout. */
function findTranscript(tui: any): { box: LayoutBox; lines: readonly string[]; top: number } | undefined {
	const layout = tui?.currentLayout;
	const scrollView = layout?.primaryScrollView;
	if (!layout?.root || !scrollView) return undefined;
	const visit = (box: LayoutBox): LayoutBox | undefined => {
		if (box.scrollView === scrollView) return box;
		for (const child of box.children ?? []) {
			const found = visit(child);
			if (found) return found;
		}
		return undefined;
	};
	const box = visit(layout.root);
	if (!box?.scrollContentLines) return undefined;
	return { box, lines: box.scrollContentLines, top: scrollView.scrollTop ?? 0 };
}

export default function stickyQuestion(pi: ExtensionAPI) {
	let enabled = true;
	let handle: { hide(): void; setHidden(h: boolean): void } | undefined;

	const show = (ctx: ExtensionContext) => {
		if (!ctx.hasUI || ctx.mode !== "tui" || handle) return;

		void ctx.ui.custom<void>(
			(tui, theme) => {
				// ANSI sequence of the user message background: used to tell them apart from assistant messages
				const userBg = theme.bg("userMessageBg", "\u0000").split("\u0000")[0];

				// Cache: recompute only when the content or scroll position changes
				let cacheLines: readonly string[] | undefined;
				let cacheTop = -1;
				let cacheQuestion: string | undefined;

				const isUserStart = (line: string) => OSC133_START.test(line) && userBg !== "" && line.includes(userBg);

				const questionAbove = (lines: readonly string[], top: number): string | undefined => {
					if (lines === cacheLines && top === cacheTop) return cacheQuestion;
					let result: string | undefined;
					// Find the closest question ABOVE the first visible row (i.e. already scrolled off screen)
					for (let row = Math.min(top, lines.length) - 1; row >= 0; row--) {
						if (!isUserStart(lines[row] ?? "")) continue;
						const parts: string[] = [];
						for (let r = row; r < lines.length && r < row + 500; r++) {
							const text = strip(lines[r] ?? "").trim();
							if (text) parts.push(text);
							if (OSC133_END.test(lines[r] ?? "")) break;
						}
						result = parts.join(" ").replace(/\s+/g, " ").trim() || undefined;
						break;
					}
					cacheLines = lines;
					cacheTop = top;
					cacheQuestion = result;
					return result;
				};

				return {
					render(width: number): string[] {
						if (!enabled) return [];
						const t = findTranscript(tui);
						if (!t) return []; // regular mode or layout not ready yet
						const question = questionAbove(t.lines, t.top);
						if (!question) return [];

						const w = Math.max(10, t.box.rect.width || width);
						const prefix = "❯ ";
						const avail = Math.max(5, w - prefix.length - 1);
						let wrapped = wrapTextWithAnsi(question, avail);
						if (wrapped.length > MAX_LINES) {
							wrapped = wrapped.slice(0, MAX_LINES);
							wrapped[MAX_LINES - 1] = `${truncateToWidth(wrapped[MAX_LINES - 1], avail - 2, "")} …`;
						}
						const out = wrapped.map((line, i) => {
							const lead = i === 0 ? theme.fg("accent", prefix) : "  ";
							const body = truncateToWidth(lead + theme.fg("userMessageText", line), w, "", true);
							return theme.bg("userMessageBg", body);
						});
						out.push(theme.fg("borderMuted", "─".repeat(w)));
						return out;
					},
					invalidate() {
						cacheLines = undefined;
					},
				};
			},
			{
				overlay: true,
				overlayOptions: { anchor: "top-left", row: 0, col: 0, width: "100%", nonCapturing: true },
				onHandle: (h) => {
					handle = h;
				},
			},
		);
	};

	const hide = () => {
		handle?.hide();
		handle = undefined;
	};

	pi.on("session_start", (_event, ctx) => show(ctx));
	pi.on("session_shutdown", () => hide());

	pi.registerCommand("sticky-question", {
		description: "Toggle the header showing the question of the answer you are reading",
		handler: async (_args, ctx) => {
			enabled = !enabled;
			show(ctx);
			ctx.ui.notify(`Sticky question ${enabled ? "enabled" : "disabled"}`, "info");
		},
	});
}
