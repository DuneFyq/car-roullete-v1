import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";
import { historyService } from "../../services/LocalStorageService";
import { randomFromArray, randomKeyFromObject } from "../../utils/randomUtils";

export const ROOT_SELECTOR = "[data-js-pandora-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly bronzeInput: string;
  readonly silverInput: string;
  readonly goldenInput: string;
}

type PandoraKey = Record<string, { chance: number }>;
type AllPandoraKeys = Record<string, PandoraKey>;

class PandoraSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
    bronzeInput: "[data-js-filter-input-bronze]",
    silverInput: "[data-js-filter-input-silver]",
    goldenInput: "[data-js-filter-input-golden]",
  };

  private readonly bronzeInput: HTMLInputElement;
  private readonly silverInput: HTMLInputElement;
  private readonly goldenInput: HTMLInputElement;

  private readonly keys: AllPandoraKeys;

  constructor(rootElement: HTMLElement, keys: AllPandoraKeys) {
    super(rootElement);

    this.bronzeInput = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.bronzeInput,
    )!;
    this.silverInput = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.silverInput,
    )!;
    this.goldenInput = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.goldenInput,
    )!;

    if (!this.bronzeInput || !this.silverInput || !this.goldenInput) {
      throw new Error(
        `SpinController: не найдены фильтры внутри ${this.selectors.root}`,
      );
    }

    this.keys = keys;

    this.init();
  }
  protected spin(): void {
    const keysArray = Object.keys(this.keys);
    let selectedIndex = -1;

    if (this.bronzeInput.checked) selectedIndex = 0;
    else if (this.silverInput.checked) selectedIndex = 1;
    else if (this.goldenInput.checked) selectedIndex = 2;
    if (selectedIndex === -1) {
      this.updateOutput("Пожалуйста, выберите тип крутки");
      return;
    }

    const key = keysArray[selectedIndex];
    const pool = this.keys[key];
    const randomValue = randomKeyFromObject(pool);

    this.updateOutput(`${key} - ${randomValue}`);
  }

  private updateOutput(resultHTML: string): void {
    if ("value" in this.resultElement) {
      this.resultElement.value = resultHTML;

      if (resultHTML === "Пожалуйста, выберите тип крутки") return;

      historyService.addRecord(resultHTML);
      document.dispatchEvent(new CustomEvent("history:updated"));
    }
  }
}

class PandoraSpinCollection {
  private controllers: PandoraSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchKeys(): Promise<AllPandoraKeys> {
    const urls = [
      "./pandora/bronze_key.json",
      "./pandora/silver_key.json",
      "./pandora/golden_key.json",
    ];

    const responses = await Promise.all(
      urls.map((url) =>
        fetch(url).then((resp) => {
          if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
          return resp.json();
        }),
      ),
    );

    const [bronze, silver, golden] = responses;

    return { bronze, silver, golden };
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
