import { BaseSpinController } from "./BaseSpinController";
import { randomFromArray, randomFromIterable } from "../../utils/randomUtils";

export const ROOT_SELECTOR = "[data-js-car-spin]";

interface CarModel {
  model: string;
  years: string;
}

type CarMap = Map<string, CarModel[]>;

class CarSpinController extends BaseSpinController {
  private readonly cars: CarMap;

  constructor(rootElement: HTMLElement, cars: CarMap) {
    super(rootElement);
    this.cars = cars;
  }

  protected spin(): void {
    const brand = randomFromIterable(this.cars.keys());
    const models = this.cars.get(brand)!;
    const { model, years } = randomFromArray(models);

    this.resultElement.value = `${brand} ${model} ${years}`;
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
