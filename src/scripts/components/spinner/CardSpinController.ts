import { BaseSpinController } from "./BaseSpinController";
import { randomFromIterable } from "../../utils/randomUtils";

const ROOT_SELECTOR = "[data-js-card-spin]";

interface CardContent {
  readonly action: string;
  readonly type: string;
}

type CardMap = Map<string, CardContent>;

class CardSpinController extends BaseSpinController {
  private readonly cards: CardMap;

  constructor(rootElement: HTMLElement, cards: CardMap) {
    super(rootElement);
    this.cards = cards;
  }

  destroy() {
    this.abortController.abort();
  }

  protected spin() {
    const name = randomFromIterable(this.cards.keys());
    const content = this.cards.get(name);
    const action = content?.action ?? 'Такой карточки нет';

    this.resultElement.value = `${name} ${action}`;
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
