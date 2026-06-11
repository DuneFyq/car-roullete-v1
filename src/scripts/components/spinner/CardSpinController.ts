import { BaseSpinController, type SpinSelectors } from "./BaseSpinController";
import {
  cardService,
  historyService,
} from "../../services/LocalStorageService ";
import { randomFromIterable } from "../../utils/randomUtils";

const ROOT_SELECTOR = "[data-js-card-spin]";

interface CustomSpinSelectors extends SpinSelectors {
  readonly root: string;
  readonly button: string;
  readonly result: string;
  readonly list: string;
}

interface CardContent {
  readonly action: string;
  readonly type: string;
}

type CardMap = Map<string, CardContent>;

class CardSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
    list: "[data-js-cards-list]",
  };

  private readonly cardsList: HTMLElement;
  private readonly cards: CardMap;

  constructor(rootElement: HTMLElement, cards: CardMap) {
    super(rootElement);

    const list = this.rootElement.querySelector<HTMLUListElement>(
      this.selectors.list,
    );

    if (!list) {
      throw new Error(
        `SpinController: не найдены элементы внутри ${this.selectors.root}`,
      );
    }

    this.cardsList = list;
    this.cards = cards;

    this.render();
  }

  destroy() {
    this.abortController.abort();
  }

  protected spin() {
    const name = randomFromIterable(this.cards.keys());
    // const content = this.cards.get(name);
    // const action = content?.action ?? "Такой карточки нет";

    this.resultElement.value = `${name}`;

    historyService.addRecord(this.resultElement.value);
    cardService.addRecord(this.resultElement.value);

    this.render();

    document.dispatchEvent(new CustomEvent("history:updated"));
  }

  private render() {
    const records = cardService.getRecords();

    this.cardsList.innerHTML = "";

    if (records.length === 0) {
      this.cardsList.innerHTML = "<li>Список пуст</li>";
      return;
    }

    const htmlStrings = records.map(
      (record) => `
      <li class="card">
        <div class="card__content">
          <p class="card__name">${record.result}</p>
          <p class="card__description">Описание</p>
        </div>
      </li>
    `,
    );

    this.cardsList.innerHTML = htmlStrings.join("");
  }
}

class CardSpinCollection {
  private controllers: CardSpinController[] = [];

  constructor() {
    this.init();
  }

  private async fetchCards(): Promise<CardMap> {
    const res = await fetch("./cards/default-cards.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = (await res.json()) as Record<string, CardContent>;
    return new Map(Object.entries(raw));
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const cards = await this.fetchCards();

    this.controllers = [...elements].map(
      (element) => new CardSpinController(element, cards),
    );
  }

  destroy() {
    this.controllers.forEach((controller) => controller.destroy());
    this.controllers.length = 0;
  }
}

export default CardSpinCollection;
