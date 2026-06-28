export class Modal {
  private modalElement: HTMLElement;
  private closeElements: HTMLElement[];

  constructor(selector: string) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Элемент модального окна "${selector}" не найден в DOM.`);
    }

    this.modalElement = element;

    this.closeElements = [
      this.modalElement.querySelector(".modal__overlay"),
      this.modalElement.querySelector(".modal__close"),
      ...Array.from(this.modalElement.querySelectorAll(".modal__cancel")),
    ].filter((element): element is HTMLElement => element !== null);

    this.bindEvents();
  }

  private handleClose = (): void => this.close();

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && this.isOpen()) {
      this.close();
    }
  };

  private bindEvents(): void {
    this.closeElements.forEach((element) =>
      element.addEventListener("click", this.handleClose),
    );
    document.addEventListener("keydown", this.handleKeyDown);
  }

  public open(): void {
    this.modalElement.removeAttribute("hidden");
    this.modalElement.classList.add("modal--active");
    document.body.classList.add("modal-open");
  }

  public close(): void {
    this.modalElement.classList.remove("modal--active");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      if (!this.isOpen()) {
        this.modalElement.setAttribute("hidden", "");
      }
    }, 300);
  }

  public isOpen(): boolean {
    return this.modalElement.classList.contains("modal--active");
  }

  public destroy(): void {
    this.closeElements.forEach((element) =>
      element.removeEventListener("click", this.handleClose),
    );
    document.removeEventListener("keydown", this.handleKeyDown);
  }
}
