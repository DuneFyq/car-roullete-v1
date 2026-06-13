import { historyService } from "../../services/LocalStorageService ";

const ROOT_SELECTOR = "[data-js-history]";

interface Selectors {
  readonly root: string;
  readonly clear: string;
  readonly list: string;
  readonly hideInput: string;
}

interface TabsStateClasses {
  readonly listActive: string;
}

class HistoryController {
  private readonly selectors: Selectors = {
    root: ROOT_SELECTOR,
    clear: "[data-js-clear-history]",
    list: "[data-js-history-list]",
    hideInput: "[data-js-hide-input]",
    
  };

  private readonly stateClasses: TabsStateClasses = {
    listActive: "history__list--active",
  };

  private readonly rootElement: HTMLElement;
  private readonly list: HTMLElement;
  private readonly hideInput: HTMLInputElement;
  private readonly abortController: AbortController;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;

    const list = this.rootElement.querySelector<HTMLButtonElement>(
      this.selectors.list,
    );
    const hideInput = this.rootElement.querySelector<HTMLInputElement>(
      this.selectors.hideInput,
    );

    if (!list || !hideInput) {
      throw new Error(
        `SpinController: не найдены элементы внутри ${this.selectors.root}`,
      );
    }

    this.list = list;
    this.hideInput = hideInput;
    this.abortController = new AbortController();

    historyService.loadFromStorage();
    this.render();
    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  private bindEvents() {
    const { signal } = this.abortController;

    const clearBtn = this.rootElement.querySelector(this.selectors.clear);
    clearBtn?.addEventListener("click", () => this.render(), { signal });

    this.hideInput.addEventListener("change", () => this.hideList());

    document.addEventListener("history:updated", () => this.render(), {
      signal,
    });
  }

  private hideList() {
    this.list.classList.toggle(
      this.stateClasses.listActive,
      !this.hideInput.checked
    );
  }

  private render() {
    const records = historyService.getRecords();

    this.list.innerHTML = "";

    if (records.length === 0) {
      this.list.innerHTML = "<li>Список пуст</li>";
      return;
    }

    const htmlStrings = records.map(
      (record) => `
      <li class="history__item ${record.id}">
          <p class="history__item--result">${record.result}</p>
          <small class="history__item--data">
            ${new Date(record.timestamp).toLocaleTimeString()}
          </small>
      </li>
    `,
    );

    this.list.innerHTML = htmlStrings.join("");

    while (records.length > 10) {
      const last = records.pop();
      if (!last) break;

      historyService.removeRecord(last.id);
    }

    this.hideList();
  }
}

class HistoryCollection {
  private controllers: HistoryController[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const elements = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);
    this.controllers = [...elements].map(
      (element) => new HistoryController(element),
    );
  }

  destroy() {
    this.controllers.forEach((controller) => controller.destroy());
    this.controllers.length = 0;
  }
}

export default HistoryCollection;
