import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";

export const ROOT_SELECTOR = "[data-js-round-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
}

class PandoraSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
  };

  constructor(rootElement: HTMLElement) {
    super(rootElement);

    this.init();
  }

  protected spin(): void {
    this.updateOutput("Раунд")
  }
}

class PandoraSpinCollection {
  private controllers: PandoraSpinController[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    this.controllers = [...elements].map(
      (element) => new PandoraSpinController(element),
    );
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default PandoraSpinCollection;
