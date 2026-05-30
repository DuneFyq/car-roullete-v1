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
  private selectors: TabsSelectors = {
    root: ROOT_SELECTOR,
    button: "[data-js-tabs-button]",
    content: "[data-js-tabs-content]",
  };

  private stateClasses: TabsStateClasses = {
    buttonActive: "roulette-nav__button--active",
    contentActive: "page--active",
  };

  private rootElement: HTMLElement;
  private tabButtons: HTMLElement[];
  private contents: HTMLElement[];

  constructor() {
    this.rootElement = document.querySelector(this.selectors.root)!;

    this.tabButtons = Array.from(
      this.rootElement.querySelectorAll(this.selectors.button),
    );
    this.contents = Array.from(
      this.rootElement.querySelectorAll(this.selectors.content),
    );

    this.bindEvents();
  }

  private bindEvents() {
    this.tabButtons.forEach((button, index) => {
      button.addEventListener("click", () => this.switchTab(index));
    });
  }

  private switchTab(activeIndex: number) {
    this.tabButtons.forEach((button, index) => {
      button.classList.toggle(
        this.stateClasses.buttonActive,
        index === activeIndex,
      );
    });

    this.contents.forEach((content, index) => {
      content.classList.toggle(
        this.stateClasses.contentActive,
        index === activeIndex,
      );
    });
  }
}

export { Tabs };