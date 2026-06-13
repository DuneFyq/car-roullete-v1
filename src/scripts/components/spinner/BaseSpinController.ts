export const ROOT_SELECTOR = "[data-js-spin]";

export interface SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly result: string;
}

export abstract class BaseSpinController {
  protected readonly selectors: SpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
  };

  protected readonly rootElement: HTMLElement;
  protected readonly buttonElement: HTMLButtonElement;
  protected readonly resultElement: HTMLInputElement;
  protected readonly abortController: AbortController;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;

    const button = this.rootElement.querySelector<HTMLButtonElement>(
      this.selectors.button,
    );
    const result = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.result,
    );

    if (!button || !result) {
      throw new Error(
        `SpinController: не найдены элементы внутри ${this.selectors.root}`,
      );
    }

    this.buttonElement = button;
    this.resultElement = result;
    this.abortController = new AbortController();
  }

  protected init() {
    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  protected bindEvents() {
    const { signal } = this.abortController;
    this.buttonElement.addEventListener("click", () => this.spin(), { signal });
  }

  protected abstract spin(): void;
}