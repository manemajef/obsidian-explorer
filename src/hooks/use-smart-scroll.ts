import { useCallback, useRef } from "react";
import { smoothScrollToTarget } from "../utils/scroll-utils";

type SmartScrollOptions = {
	offsetEm?: number;
	durationMs?: number;
};

export function useSmartScroll(options: SmartScrollOptions = {}) {
	const { offsetEm = 0, durationMs = 300 } = options;
	const targetRef = useRef<HTMLElement | null>(null);

	const scrollToTarget = useCallback((): boolean => {
		const target = targetRef.current;
		if (!target) return false;
		const fontSize = parseFloat(getComputedStyle(target).fontSize) || 16;
		smoothScrollToTarget(target, fontSize * offsetEm, durationMs);
		return true;
	}, [durationMs, offsetEm]);

	const scrollToElement = useCallback(
		(el: HTMLElement | null, offsetPx = 0): boolean => {
			if (!el) return false;
			smoothScrollToTarget(el, offsetPx, durationMs);
			return true;
		},
		[durationMs]
	);

	const scrollToTopOf = useCallback(
		(el: HTMLElement | null): boolean => {
			if (!el) return false;
			smoothScrollToTarget(el, 0, durationMs);
			return true;
		},
		[durationMs]
	);

	return {
		targetRef,
		scrollToTarget,
		scrollToElement,
		scrollToTopOf,
	};
}
