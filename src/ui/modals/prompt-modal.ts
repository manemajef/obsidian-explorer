import { App, Modal } from "obsidian";

export class PromptModal extends Modal {
	title: string;
	placeholder: string;
	resolve: (value: string | null) => void;
	value: string = "";

	constructor(
		app: App,
		title: string,
		placeholder: string,
		resolve: (value: string | null) => void
	) {
		super(app);
		this.title = title;
		this.placeholder = placeholder;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h3", { text: this.title });

		const input = contentEl.createEl("input", {
			attr: {
				type: "text",
				placeholder: this.placeholder,
				style: "width: 100%; padding: 8px; margin: 8px 0;",
			},
		});

		input.addEventListener("input", () => {
			this.value = input.value;
		});

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				this.resolve(this.value || null);
				this.close();
			}
			if (e.key === "Escape") {
				this.resolve(null);
				this.close();
			}
		});

		const btnContainer = contentEl.createDiv({
			attr: { style: "display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;" },
		});

		const cancelBtn = btnContainer.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.resolve(null);
			this.close();
		});

		const okBtn = btnContainer.createEl("button", { text: "Create", cls: "mod-cta" });
		okBtn.addEventListener("click", () => {
			this.resolve(this.value || null);
			this.close();
		});

		input.focus();
	}

	onClose() {
		this.contentEl.empty();
	}
}
