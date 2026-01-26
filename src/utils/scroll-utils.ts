export function findScrollParent(el: HTMLElement): HTMLElement | null {
	let current: HTMLElement | null = el.parentElement;
	while (current) {
		const style = window.getComputedStyle(current);
		if (
			(style.overflowY === "auto" || style.overflowY === "scroll") &&
			current.scrollHeight > current.clientHeight
		) {
			return current;
		}
		current = current.parentElement;
	}
	return document.scrollingElement as HTMLElement | null;
}

export function getTargetOffset(target: HTMLElement, scroller: HTMLElement): number {
	let offset = 0;
	let node: HTMLElement | null = target;
	while (node && node !== scroller) {
		offset += node.offsetTop;
		node = node.offsetParent as HTMLElement | null;
	}
	if (node === scroller) return offset;
	const targetRect = target.getBoundingClientRect();
	const scrollerRect = scroller.getBoundingClientRect();
	return targetRect.top - scrollerRect.top + scroller.scrollTop;
}

export function smoothScrollToTarget(
	target: HTMLElement,
	offsetPx = 0,
	durationMs = 300
): void {
	const scroller = findScrollParent(target);
	if (!scroller) {
		target.scrollIntoView({ behavior: "smooth", block: "start" });
		return;
	}

	const start = scroller.scrollTop;
	const targetTop = getTargetOffset(target, scroller) - offsetPx;
	const change = targetTop - start;
	const startTime = performance.now();

	const ease = (t: number): number =>
		t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

	const step = (now: number) => {
		const elapsed = now - startTime;
		const progress = Math.min(1, elapsed / durationMs);
		scroller.scrollTop = start + change * ease(progress);
		if (progress < 1) {
			window.requestAnimationFrame(step);
		}
	};

	window.requestAnimationFrame(step);
}
