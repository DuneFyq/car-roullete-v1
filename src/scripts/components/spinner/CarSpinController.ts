import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";
import { historyService } from "../../services/LocalStorageService ";
import { randomFromArray, randomFromIterable } from "../../utils/randomUtils";

export const ROOT_SELECTOR = "[data-js-car-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly filterInputExclusive: string;
  readonly filterInputPremium: string;
}

interface CarModel {
  model: string;
  years: string;
  class: string;
}

type CarMap = Map<string, CarModel[]>;

class CarSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
    filterInputExclusive: "[data-js-filter-input-exclusive]",
    filterInputPremium: "[data-js-filter-input-premium]",
  };

  private readonly filterInputExclusive: HTMLInputElement;
  private readonly filterInputPremium: HTMLInputElement;
  private readonly cars: CarMap;

  constructor(rootElement: HTMLElement, cars: CarMap) {
    super(rootElement);

    const filterInputExclusive =
      this.rootElement.querySelector<HTMLInputElement>(
        this.selectors.filterInputExclusive,
      );
    const filterInputPremium = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.filterInputPremium,
    );

    if (!filterInputExclusive || !filterInputPremium) {
      throw new Error(
        `SpinController: не найдены элементы внутри ${this.selectors.root}`,
      );
    }

    this.filterInputExclusive = filterInputExclusive;
    this.filterInputPremium = filterInputPremium;

    this.cars = cars;
    this.init();
  }

  protected spin(): void {
    let brand: string;

    while (true) {
      brand = randomFromIterable(this.cars.keys());

      const isPremiumFiltered =
        brand === "Premium" && this.filterInputPremium.checked;
      const isExclusiveFiltered =
        brand === "Exclusive" && this.filterInputExclusive.checked;

      if (!isPremiumFiltered && !isExclusiveFiltered) {
        break;
      }
    }

    const isSpecial = brand === "Premium" || brand === "Exclusive";

    const models = this.cars.get(brand);
    if (!models?.length) return;

    const specialMap = isSpecial
      ? (models[0] as unknown as Record<string, CarModel[]>)
      : null;
    const actualBrand = isSpecial
      ? randomFromIterable(Object.keys(specialMap!))
      : brand;
    const targetCars = isSpecial ? specialMap![actualBrand] : models;

    const randomCar = randomFromArray(targetCars);
    if (!randomCar) return;

    let result = `
      ${actualBrand}
      ${randomCar.model}
      ${randomCar.years}-
      <span class="class--${randomCar.class}">
        "${randomCar.class}"
      </span>
    `;

    if (this.resultElement.innerHTML === result) {
      result += " (Повтор!)";
    }

    this.resultElement.innerHTML = result;

    historyService.addRecord(result);
    document.dispatchEvent(new CustomEvent("history:updated"));
  }
}

class CarSpinCollection {
  private controllers: CarSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchCars(): Promise<CarMap> {
    const res = await fetch("./cars/forza-horizon-6.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = (await res.json()) as Record<string, CarModel[]>;
    return new Map(Object.entries(raw));
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const cars = await this.fetchCars();
    this.controllers = [...elements].map(
      (element) => new CarSpinController(element, cars),
    );
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default CarSpinCollection;
