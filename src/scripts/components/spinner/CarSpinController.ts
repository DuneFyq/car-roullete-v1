import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";
import { randomFromArray } from "../../utils/randomUtils";

export const ROOT_SELECTOR = "[data-js-car-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly result: string;
  readonly filterInputExclusive: string;
  readonly filterInputPremium: string;
}

interface CarModel {
  model: string;
  years: string;
  class: string;
  isPremium?: boolean;
  isExclusive?: boolean;
}

type RawCarJson = Map<string, CarModel[] | [Record<string, CarModel[]>]>;
type FlatCar = { brand: string; model: CarModel };

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

  private readonly allCars: FlatCar[] = [];
  private readonly carsWithoutPremium: FlatCar[] = [];
  private readonly carsWithoutExclusive: FlatCar[] = [];
  private readonly carsWithoutBoth: FlatCar[] = [];

  constructor(rootElement: HTMLElement, cars: Map<string, CarModel>) {
    super(rootElement);

    this.filterInputExclusive =
      this.rootElement.querySelector<HTMLInputElement>(
        this.selectors.filterInputExclusive,
      )!;
    this.filterInputPremium = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.filterInputPremium,
    )!;

    if (!this.filterInputExclusive || !this.filterInputPremium) {
      throw new Error(
        `SpinController: не найдены фильтры внутри ${this.selectors.root}`,
      );
    }

    this.buildCarLists(cars);
    this.init();
  }

  protected spin(): void {
    const cars = this.getCarsForCurrentFilters();

    if (cars.length === 0) {
      this.updateOutput(
        `<span class="class--error">Нет доступных машин для текущих фильтров</span>`,
      );
      return;
    }

    const luckyShot = randomFromArray(cars);
    this.updateOutput(this.generateCarHTML(luckyShot.brand, luckyShot.model));
  }

  private getCarsForCurrentFilters(): FlatCar[] {
    const skipPremium = this.filterInputPremium.checked;
    const skipExclusive = this.filterInputExclusive.checked;

    if (skipPremium && skipExclusive) return this.carsWithoutBoth;
    if (skipPremium) return this.carsWithoutPremium;
    if (skipExclusive) return this.carsWithoutExclusive;
    return this.allCars;
  }

  private buildCarLists(cars: Map<string, CarModel>): void {
    for (const [brand, models] of cars.entries()) {
      if (!Array.isArray(models) || models.length === 0) continue;

      const carPairs = this.extractCarPairs(brand, models);
      const isPremium = brand === "Premium";
      const isExclusive = brand === "Exclusive";

      for (const pair of carPairs) {
        this.allCars.push(pair);

        if (!isPremium) {
          this.carsWithoutPremium.push(pair);
        }

        if (!isExclusive) {
          this.carsWithoutExclusive.push(pair);
        }

        if (!isPremium && !isExclusive) {
          this.carsWithoutBoth.push(pair);
        }
      }
    }
  }

  private extractCarPairs(
    brand: string,
    models: CarModel[] | [Record<string, CarModel[]>],
  ): FlatCar[] {
    const isSpecial = brand === "Premium" || brand === "Exclusive";

    if (!isSpecial) {
      return (models as CarModel[]).map((model) => ({ brand, model }));
    }

    const specialMap = models[0] as Record<string, CarModel[]>;
    const pairs: FlatCar[] = [];

    for (const [actualBrand, specialModels] of Object.entries(specialMap)) {
      for (const model of specialModels) {
        pairs.push({ brand: actualBrand, model });
      }
    }

    return pairs;
  }

  private generateCarHTML(brand: string, car: CarModel) {
    const { model, years, class: carClass } = car;

    return `${brand} ${model} ${years} - <span class="class--${carClass}">"${carClass}"</span>`;
  }
}

class CarSpinCollection {
  public controllers: CarSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchCars(): Promise<Map<string, CarModel>> {
    const res = await fetch("./cars/forza-horizon-6.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = (await res.json()) as RawCarJson;
    return new Map(Object.entries(raw));
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const cars = await this.fetchCars();

    this.controllers = Array.from(elements).map(
      (element) => new CarSpinController(element, cars),
    );
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default CarSpinCollection;
