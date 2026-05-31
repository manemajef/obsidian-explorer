import { App, Modal } from "obsidian";

/**
 * Prompt user for a name/input via modal
 */
export function promptForName(
  app: App,
  title: string,
  placeholder: string,
  initialValue = "",
  submitLabel = "Create",
): Promise<string | null> {
  return new Promise((resolve) => {
    new PromptModal(
      app,
      title,
      placeholder,
      resolve,
      initialValue,
      submitLabel,
    ).open();
  });
}

export class ConfirmationDialog extends Modal {
  title: string;
  message?: string | DocumentFragment;
  onConfirm: (dontShowAgain: boolean) => void | Promise<void>;
  onDontShowAgain?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  private isSettled = false;

  constructor(
    app: App,
    title: string,
    onConfirm: (dontShowAgain: boolean) => void | Promise<void>,
    onDontShowAgain?: () => void | Promise<void>,
    message?: string | DocumentFragment,
    onCancel?: () => void | Promise<void>,
  ) {
    super(app);
    this.title = title;
    this.message = message;
    this.onConfirm = onConfirm;
    this.onDontShowAgain = onDontShowAgain;
    this.onCancel = onCancel;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.modalEl.addClass("explorer-confirmation-dialog");
    this.setTitle(this.title);

    if (this.message) {
      const messageEl = contentEl.createEl("div");
      if (typeof this.message === "string") {
        messageEl.setText(this.message);
      } else {
        messageEl.appendChild(this.message);
      }
    }

    let dontShowAgainInput: HTMLInputElement | null = null;

    if (this.onDontShowAgain) {
      const checkboxLabel = contentEl.createEl("label", {
        cls: "explorer-confirmation-dialog-checkbox",
      });

      dontShowAgainInput = checkboxLabel.createEl("input", {
        attr: { type: "checkbox" },
      });
      checkboxLabel.createSpan({ text: "Don't show again" });
    }

    const btnContainer = contentEl.createDiv({
      cls: "explorer-confirmation-dialog-actions",
    });

    const cancelBtn = btnContainer.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => {
      this.isSettled = true;
      void this.onCancel?.();
      this.close();
    });

    const confirmBtn = btnContainer.createEl("button", {
      text: "Confirm",
      cls: "mod-cta",
    });
    confirmBtn.addEventListener("click", () => {
      const dontShowAgain = dontShowAgainInput?.checked ?? false;

      void this.confirm(dontShowAgain);
    });
  }

  private async confirm(dontShowAgain: boolean): Promise<void> {
    this.isSettled = true;
    if (dontShowAgain) {
      await this.onDontShowAgain?.();
    }

    await this.onConfirm(dontShowAgain);
    this.close();
  }

  onClose() {
    if (!this.isSettled) {
      this.isSettled = true;
      void this.onCancel?.();
    }
    this.contentEl.empty();
  }
}

export class PromptModal extends Modal {
  title: string;
  placeholder: string;
  resolve: (value: string | null) => void;
  initialValue: string;
  submitLabel: string;
  value: string = "";

  constructor(
    app: App,
    title: string,
    placeholder: string,
    resolve: (value: string | null) => void,
    initialValue = "",
    submitLabel = "Create",
  ) {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.resolve = resolve;
    this.initialValue = initialValue;
    this.submitLabel = submitLabel;
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
    input.value = this.initialValue;

    const submit = () => {
      const value = input.value || "";
      this.resolve(value.trim() || null);
      this.close();
    };

    input.addEventListener("input", () => {
      this.value = input.value;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        submit();
      }
      if (e.key === "Escape") {
        this.resolve(null);
        this.close();
      }
    });

    const btnContainer = contentEl.createDiv({
      attr: {
        style:
          "display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px;",
      },
    });

    const cancelBtn = btnContainer.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => {
      this.resolve(null);
      this.close();
    });

    const okBtn = btnContainer.createEl("button", {
      text: this.submitLabel,
      cls: "mod-cta",
    });
    okBtn.addEventListener("click", () => {
      submit();
    });

    input.focus();
    input.select();
  }

  onClose() {
    this.contentEl.empty();
  }
}
