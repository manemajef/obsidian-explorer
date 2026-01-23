import { App, setIcon } from "obsidian";

export function renderPagination(
	container: HTMLElement,
	currentPage: number,
	totalPages: number,
	app: App,
	onPageChange: (page: number) => void
): void {
	const wrapper = container.createDiv({
		attr: { dir: "ltr", style: "display: flex; justify-content: center;" },
	});

	const paging = wrapper.createDiv({ cls: "paging-controll" });
	const isMobile = (app as any).isMobile;
	const page = currentPage;

	// Previous button
	const prevBtn = paging.createSpan({ cls: "paging-label paging-icon" });
	setIcon(prevBtn, "chevron-left");
	prevBtn.addEventListener("click", () => {
		if (currentPage > 0) {
			onPageChange(currentPage - 1);
		}
	});

	// Page numbers container
	const numsDiv = paging.createDiv({ cls: "paging-controll-nums" });

	const useLeftDots = isMobile ? page > 1 : page > 2;
	const useRightDots = isMobile ? page < totalPages - 2 : page < totalPages - 3;

	const leftPages = [isMobile ? -10000 : page - 2, page - 1].filter((p) => p > 0);
	const rightPages = [page + 1, isMobile ? totalPages + 1 : page + 2].filter(
		(p) => p < totalPages - 1
	);

	// First page (if not current)
	if (page !== 0) {
		const btn = numsDiv.createSpan({ cls: "paging-num paging-label", text: "1" });
		btn.addEventListener("click", () => onPageChange(0));
	}

	// Left dots
	if (useLeftDots) {
		const dots = numsDiv.createSpan({ cls: "paging-label paging-dots" });
		setIcon(dots, "ellipsis");
	}

	// Left pages
	for (const p of leftPages) {
		const btn = numsDiv.createSpan({ cls: "paging-label paging-num", text: String(p + 1) });
		btn.addEventListener("click", () => onPageChange(p));
	}

	// Current page
	numsDiv.createSpan({
		cls: "paging-label active-page paging-num",
		text: String(page + 1),
	});

	// Right pages
	for (const p of rightPages) {
		const btn = numsDiv.createSpan({ cls: "paging-label paging-num", text: String(p + 1) });
		btn.addEventListener("click", () => onPageChange(p));
	}

	// Right dots
	if (useRightDots) {
		const dots = numsDiv.createSpan({ cls: "paging-label paging-dots" });
		setIcon(dots, "ellipsis");
	}

	// Last page (if not current)
	if (page !== totalPages - 1) {
		const btn = numsDiv.createSpan({
			cls: "paging-num paging-label",
			text: String(totalPages),
		});
		btn.addEventListener("click", () => onPageChange(totalPages - 1));
	}

	// Next button
	const nextBtn = paging.createSpan({ cls: "paging-label paging-icon" });
	setIcon(nextBtn, "chevron-right");
	nextBtn.addEventListener("click", () => {
		if (currentPage < totalPages - 1) {
			onPageChange(currentPage + 1);
		}
	});
}
