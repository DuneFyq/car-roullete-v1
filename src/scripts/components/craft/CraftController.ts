const ROOT_SELECTOR = "[data-js-craft]";

interface SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly result: string;
}

class CraftController {
  private readonly selectors: SpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
  };

  private readonly rootElement: HTMLElement;
  private readonly buttonElement: HTMLButtonElement;
  private readonly resultElement: HTMLInputElement;
  private readonly abortController: AbortController;

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

    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  private bindEvents() {
    const { signal } = this.abortController;
    this.buttonElement.addEventListener("click", () => this.spin(), { signal });
  }

  private spin() {
    this.resultElement.value = 'Крафты';
  }
}

class PandoraSpinCollection {
  private controllers: CraftController[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    this.controllers = [...elements].map(
      (element) => new CraftController(element),
    );
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default PandoraSpinCollection;
