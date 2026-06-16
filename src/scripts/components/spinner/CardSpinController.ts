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
  readonly subMenu: string;
  readonly addCardInputWrapper: string;
}

interface CardContent {
  readonly action: string;
  readonly type: string;
}

interface TabsStateClasses {
  readonly cardSelected: string;
  readonly addCardActive: string;
}

type CardMap = Map<string, CardContent>;

class CardSpinController extends BaseSpinController {
  protected readonly selectors: CustomSpinSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-spin-button]",
    result: "[data-js-spin-result]",
    list: "[data-js-cards-list]",
    subMenu: "[data-js-sub-menu]",
    addCardInputWrapper: "[data-js-input-wrapper]",
  };

  private readonly stateClasses: TabsStateClasses = {
    cardSelected: "card__content--selected",
    addCardActive: "tab-cards__input-wrapper--active",
  };

  private readonly cardsList: HTMLElement;
  private readonly subMenu: HTMLElement;
  private readonly addCardInputWrapper: HTMLElement;
  private readonly cards: CardMap;

  constructor(rootElement: HTMLElement, cards: CardMap) {
    super(rootElement);

    const list = this.rootElement.querySelector<HTMLUListElement>(
      this.selectors.list,
    );
    const subMenu = this.rootElement.querySelector<HTMLElement>(
      this.selectors.subMenu,
    );
    const addCardInputWrapper =
      this.rootElement.querySelector<HTMLInputElement>(
        this.selectors.addCardInputWrapper,
      );

    if (!list || !subMenu || !addCardInputWrapper) {
      throw new Error(
        `SpinController: не найдены элементы внутри ${this.selectors.root}`,
      );
    }

    this.cardsList = list;
    this.subMenu = subMenu;
    this.addCardInputWrapper = addCardInputWrapper;
    this.cards = cards;

    this.render();
    this.init();
  }

  protected bindEvents() {
    super.bindEvents();

    const { signal } = this.abortController;
    this.cardsList.addEventListener(
      "click",
      (event) => this.selectObject(event),
      { signal },
    );
    this.subMenu.addEventListener(
      "click",
      (event) => this.bindButtonHandlers(event),
      { signal },
    );
  }

  private bindButtonHandlers(event: Event) {
    const target = event.target as HTMLElement;
    const button = target.closest("button");

    if (!button || !this.subMenu.contains(button)) {
      return;
    }

    const action = button.dataset.action;

    switch (action) {
      case "use-all":
        this.handleUseAll();
        break;
      case "use-specific":
        this.handleUseSpecific();
        break;
      case "add-card":
        this.handleAddCard();
        break;
      default:
        console.warn(`Необработанное действие: ${action}`);
    }
  }

  private handleUseAll() {
    cardService.clearStorage();
    this.render();
  }

  private handleUseSpecific() {
    const selectedElements = this.cardsList.querySelectorAll(
      `.card__content.${this.stateClasses.cardSelected}`,
    );

    const selectedIds = [...selectedElements]
      .map((contentElement) => {
        const li = contentElement.closest(".card");
        return li ? li.classList[1] : null;
      })
      .filter(Boolean) as string[];

    console.log("ID выбранных карточек:", selectedIds);

    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      cardService.removeRecord(id);
    });

    this.render();
  }

  private handleAddCard() {
    this.addCardInputWrapper.classList.add(this.stateClasses.addCardActive);

    const input = this.addCardInputWrapper.querySelector<HTMLInputElement>(
      ".tab-cards__input-name",
    );
    if (!input) return;
    if (!this.cards.has(input.value)) return;

    const cardName = input.value;
    cardService.addRecord(cardName);
    this.render();

    input.value = "";
  }

  private selectObject({ target }: Event) {
    if (target instanceof HTMLElement) {
      const parent = target.closest(".card__content");
      if (!parent) return;

      parent.classList.toggle(this.stateClasses.cardSelected);
    }
  }

  protected spin() {
    const countCard = cardService.getRecords();
    if (countCard.length === 35) return;

    const name = randomFromIterable(this.cards.keys());
    const content = this.cards.get(name);
    const type = content?.type ?? "Типа не имеет";

    if ("value" in this.resultElement) {
      this.resultElement.value = `${name} - ${type}`;
    }

    historyService.addRecord(name);
    cardService.addRecord(name);

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

    const htmlStrings = records.map((record) => {
      const content = this.cards.get(record.result);
      const type = content?.type ?? "Типа не имеет";

      return `
      <li class="card ${record.id}">
        <div class="card__content">
          <p class="card__name">${record.result}</p>
          <p class="card__type card__type--${type.toLowerCase()}">${type}</p>
        </div>
      </li>
    `;
    });

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
