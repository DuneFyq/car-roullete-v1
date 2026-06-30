const ROOT_SELECTOR = "[data-js-craft-page]";

interface SpinSelectors {
  readonly panel: string;
  readonly select: string;
  readonly description: string;
  readonly elements: readonly string[];
}

interface TabsStateClasses {
  readonly ingredientsActive: string;
}

interface Cards {
  readonly name: string;
  readonly content: {
    readonly ingredients: readonly string[];
    readonly action: string;
    readonly type: string;
    readonly used: string;
  };
}

class CraftController {
  private readonly selectors: SpinSelectors = {
    panel: "[data-js-craft-panel]",
    select: "[data-js-select]",
    description: "[data-js-card-description ]",
    elements: [
      "[data-js-element='0']",
      "[data-js-element='1']",
      "[data-js-element='2']",
    ],
  };

  private readonly stateClasses: TabsStateClasses = {
    ingredientsActive: "tab-craft__ingredient--active",
  };

  private readonly rootElement: HTMLElement;
  private readonly select: HTMLSelectElement;
  private description: HTMLInputElement;
  private elementNodes: HTMLInputElement[];

  private readonly cards: Record<string, Cards>;
  private readonly abortController: AbortController;

  constructor(rootElement: HTMLElement, cards: Record<string, Cards>) {
    this.rootElement = rootElement;

    const panel = this.rootElement.querySelector<HTMLElement>(
      this.selectors.panel,
    );

    if (!panel) {
      throw new Error(
        `CraftController: не найден panel внутри ${ROOT_SELECTOR}`,
      );
    }

    const select = panel.querySelector<HTMLSelectElement>(
      this.selectors.select,
    );
    const description = panel.querySelector<HTMLInputElement>(
      this.selectors.description,
    );
    const elementNodes = this.selectors.elements.map((sel) =>
      panel.querySelector<HTMLInputElement>(sel),
    );

    if (!select || !description || elementNodes.some((node) => !node)) {
      throw new Error(
        `CraftController: не найдены элементы внутри ${ROOT_SELECTOR}`,
      );
    }

    this.select = select;
    this.description = description;
    this.elementNodes = elementNodes as HTMLInputElement[];
    this.cards = cards;

    this.abortController = new AbortController();

    this.setValueForSelect();
    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  private setValueForSelect() {
    Object.values(this.cards).forEach((card) => {
      const option = document.createElement("option");
      option.classList.add("elite-card");
      option.value = card.name;
      option.textContent = card.name;
      this.select.append(option);
    });
  }

  private setDescription(currentCard: string) {
    const description = this.cards[currentCard]?.content.action;
    this.description.value = description;
  }

  private setIngredients() {
    const currentCard = this.select.value;
    if (currentCard === "Выберите эл.карточку") return;

    const contentCard = this.cards[currentCard]?.content.ingredients;
    if (!contentCard) return;

    this.setDescription(currentCard);

    for (let i = this.elementNodes.length - 1; i >= 0; i--) {
      const ingredient = contentCard[i];

      this.elementNodes[i].value = ingredient || "";
      this.elementNodes[i].classList.toggle(
        this.stateClasses.ingredientsActive,
        !!ingredient,
      );
    }
  }

  private bindEvents() {
    const { signal } = this.abortController;

    this.select.addEventListener("change", () => this.setIngredients(), {
      signal,
    });
  }
}

class CraftCollection {
  private controllers: CraftController[] = [];
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.init();
  }

  private async getCards(): Promise<Record<string, Cards>> {
    const res = await fetch("./cards/elite-cards.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const raw = (await res.json()) as Record<string, Cards["content"]>;

    const cards: Record<string, Cards> = {};
    for (const [name, content] of Object.entries(raw)) {
      cards[name] = { name, content };
    }

    return cards;
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    const cards = await this.getCards();

    this.controllers = [...elements].map(
      (element) => new CraftController(element, cards),
    );
  }

  public async destroy() {
    await this.initPromise;
    this.controllers.forEach((c) => c.destroy());
    this.controllers = [];
  }
}

export default CraftCollection;
