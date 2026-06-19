import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";
import { historyService } from "../../services/LocalStorageService";
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
}

type RawCarJson = Record<string, CarModel[] | [Record<string, CarModel[]>]>;
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
  private readonly flatCars: FlatCar[];

  constructor(rootElement: HTMLElement, cars: Map<string, CarModel>) {
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
        `SpinController: не найдены фильтры внутри ${this.selectors.root}`,
      );
    }

    this.filterInputExclusive = filterInputExclusive;
    this.filterInputPremium = filterInputPremium;

    this.flatCars = this.buildFlatCars(cars);

    if (this.flatCars.length === 0) {
      throw new Error(`SpinController: не найден корректный список машин`);
    }

    this.init();
  }

  protected spin(): void {
    const luckyShot = randomFromArray(this.flatCars);
    const resultHTML = this.generateCarHTML(luckyShot.brand, luckyShot.model);
    this.updateOutput(resultHTML);
  }

  private buildFlatCars(cars: Map<string, CarModel>): FlatCar[] {
    const flatCars: FlatCar[] = [];
    const skipPremium = this.filterInputPremium.checked;
    const skipExclusive = this.filterInputExclusive.checked;

    for (const [brand, models] of cars.entries()) {
      if (!Array.isArray(models) || models.length === 0) continue;

      if (brand === "Premium" || brand === "Exclusive") {
        if (
          (brand === "Premium" && skipPremium) ||
          (brand === "Exclusive" && skipExclusive)
        ) {
          continue;
        }

        const specialMap = models[0] as Record<string, CarModel[]>;
        for (const [actualBrand, specialModels] of Object.entries(specialMap)) {
          for (const model of specialModels) {
            flatCars.push({ brand: actualBrand, model });
          }
        }
      } else {
        for (const model of models) {
          flatCars.push({ brand, model });
        }
      }
    }

    return flatCars;
  }

  private generateCarHTML(brand: string, car: CarModel): string {
    return `${brand} ${car.model} ${car.years}- <span class="class--${car.class}">"${car.class}"</span>`;
  }

  private updateOutput(resultHTML: string): void {
    this.resultElement.innerHTML = resultHTML;
    historyService.addRecord(resultHTML);
    document.dispatchEvent(new CustomEvent("history:updated"));
  }
}

class CarSpinCollection {
  private controllers: CarSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchCars(): Promise<Map<string, any>> {
    const res = await fetch("./cars/forza-horizon-6.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = (await res.json()) as RawCarJson;
    return new Map(Object.entries(raw));
  }

  private async init(): Promise<void> {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const cars = await this.fetchCars();

    this.controllers = Array.from(elements).map(
      (element) => new CarSpinController(element, cars),
    );
  }

  public destroy(): void {
    this.controllers.forEach((c) => c.destroy());
    this.controllers.length = 0;
  }
}

export default CarSpinCollection;
