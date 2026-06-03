const ROOT_SELECTOR = "[data-js-tabs]";

interface TabsSelectors {
  readonly root: string;
  readonly button: string;
  readonly content: string;
}

interface TabsStateClasses {
  readonly buttonActive: string;
  readonly contentActive: string;
}

class Tabs {
  private readonly selectors: TabsSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-tabs-button]",
    content: "[data-js-tabs-content]",
  };

  private readonly stateClasses: TabsStateClasses = {
    buttonActive: "roulette-nav__button--active",
    contentActive: "tab--active",
  };

  private readonly rootElement: HTMLElement;
  private readonly tabButtonElements: HTMLElement[];
  private readonly contentElements: HTMLElement[];
  private readonly abortController: AbortController;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;

    this.tabButtonElements = Array.from(this.rootElement.querySelectorAll<HTMLElement>(this.selectors.button)!); 
    this.contentElements = Array.from(this.rootElement.querySelectorAll<HTMLElement>(this.selectors.content)!);

    this.abortController = new AbortController();

    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  private bindEvents() {
    const { signal } = this.abortController;

    this.tabButtonElements.forEach((button, index) => {
      button.addEventListener("click", () => this.switchTab(index), { signal });
    });
  }

  private switchTab(activeIndex: number) {
    this.tabButtonElements.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle(this.stateClasses.buttonActive, isActive);
    });

    this.contentElements.forEach((content, index) => {
      const isActive = index === activeIndex;
      content.classList.toggle(this.stateClasses.contentActive, isActive);
    });
  }
}

class TabsCollection {
  private readonly instances: Tabs[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR)!;

    elements.forEach((element) => {
      this.instances.push(new Tabs(element));
    });
  }

  destroy() {
    this.instances.forEach((instance) => instance.destroy());
    this.instances.length = 0;
  }
}

export default TabsCollection;
