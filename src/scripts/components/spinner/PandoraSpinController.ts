import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";

export const ROOT_SELECTOR = "[data-js-pandora-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
}

type PandoraKey = Record<string, { chance: number }>
type AllPandoraKeys = Record<string, PandoraKey>

class PandoraSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
  };

  private readonly keys: AllPandoraKeys;

  constructor(rootElement: HTMLElement, keys: AllPandoraKeys) {
    super(rootElement);

    this.keys = keys;
    
    this.init();
  }

  protected spin(): void {
    if ("value" in this.resultElement) {
      this.resultElement.value = "Пандора";
      console.log(this.keys);
    }
  }
}

class PandoraSpinCollection {
  private controllers: PandoraSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchKeys(): Promise<AllPandoraKeys> {
    return {
      "sliver": {
        "dayn": { chance: 0 }
      },
      "golden": {
        "dayn": { chance: 0 }
      }
    };
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const keys: AllPandoraKeys = await this.fetchKeys();

    this.controllers = [...elements].map(
      (element) => new PandoraSpinController(element, keys),
    );
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default PandoraSpinCollection;