import { historyService } from "../../services/LocalStorageService";
import {
  randomFromArray,
  randomFromIterable,
  randomKeyFromObject,
} from "../../utils/randomUtils";

const SELECTORS = {
  root: "[data-js-round-spin]",
  field: "[data-js-field]",
  spinButton: "[data-js-spin-button]",
  result: "[data-js-result]",
  playerList: "[data-js-player-list]",
} as const;

const FieldName = {
  Discipline: "discipline",
  Weather: "weather",
  Player: "player",
  Track: "track",
  Modifier: "modifier",
} as const;
type FieldName = (typeof FieldName)[keyof typeof FieldName];

interface Modifier {
  name: string;
  description: string;
}

type Discipline = Record<string, string[]>;

interface RoundConfig {
  discipline: Discipline;
  weather: string[];
  modifier: Modifier[];
}

const UI_MESSAGES = {
  NO_DISCIPLINE: "Прокрутите дисциплину",
  NO_PLAYERS: "Заполните список",
} as const;

class RoundSpinController {
  private readonly discipline: Discipline;
  private readonly weather: string[];
  private readonly modifiers: Modifier[];

  private readonly rootElement: HTMLElement;
  protected readonly abortController: AbortController;

  constructor(
    rootElement: HTMLElement,
    discipline: Discipline,
    weather: string[],
    modifiers: Modifier[],
  ) {
    this.rootElement = rootElement;
    this.discipline = discipline;
    this.weather = weather;
    this.modifiers = modifiers;
    this.abortController = new AbortController();

    this.bindEvents();
  }

  destroy() {
    this.abortController.abort();
  }

  private bindEvents() {
    const { signal } = this.abortController;

    this.rootElement.addEventListener(
      "click",
      (e: Event) => {
        const target = e.target as HTMLElement;
        const button = target.closest<HTMLElement>(SELECTORS.spinButton);

        if (!button) return;

        const fieldElement = button.closest<HTMLElement>(SELECTORS.field);
        if (!fieldElement) return;

        const resultInput = fieldElement.querySelector<HTMLInputElement>(
          SELECTORS.result,
        );
        const fieldName = fieldElement.dataset.jsField as FieldName;

        if (resultInput && fieldName) {
          this.handleButtonClick(e, fieldName, resultInput);
        }
      },
      { signal },
    );
  }

  private readonly fieldHandlers: Record<
    FieldName,
    (input: HTMLInputElement) => void
  > = {
    [FieldName.Discipline]: (input) => {
      const randomDiscipline = randomKeyFromObject(this.discipline);
      this.updateOutput(input, randomDiscipline);
    },

    [FieldName.Player]: (input) => {
      const randomPlayer = this.getRandomPlayerForList();
      input.value = randomPlayer;
    },

    [FieldName.Weather]: (input) => {
      const randomWeather = randomFromArray(this.weather);
      this.updateOutput(input, randomWeather);
    },

    [FieldName.Track]: (input) => {
      const randomTrack = this.getRandomTrackForCurrentDiscipline();
      if (!randomTrack) {
        this.updateOutput(input, UI_MESSAGES.NO_DISCIPLINE);
        return;
      }
      this.updateOutput(input, randomTrack);
    },

    [FieldName.Modifier]: (input) => {
      const randomModifier = randomFromIterable(this.modifiers);
      this.updateOutput(input, randomModifier.name);
    },
  };

  private getRandomPlayerForList(): string {
    const list = this.rootElement.querySelector<HTMLTextAreaElement>(
      SELECTORS.playerList,
    );
    const rawList = list?.value || "";
    const players = rawList.split("\n").filter((item) => item.trim() !== "");

    if (players.length === 0) return UI_MESSAGES.NO_PLAYERS;
    return randomFromArray(players);
  }

  private getRandomTrackForCurrentDiscipline(): string {
    const currentDiscipline = this.getCurrentDiscipline();

    if (!currentDiscipline || !this.discipline[currentDiscipline]) {
      return "";
    }
    return randomFromArray(this.discipline[currentDiscipline]);
  }

  private getCurrentDiscipline(): string {
    const field = this.rootElement.querySelector<HTMLElement>(SELECTORS.field);
    const input = field?.querySelector<HTMLInputElement>(SELECTORS.result);
    return input?.value ?? "";
  }

  private handleButtonClick(e:Event ,fieldName: FieldName, result: HTMLInputElement) {
    e.preventDefault();
    const handler = this.fieldHandlers[fieldName];

    if (handler) {
      handler(result);
    } else {
      console.warn(`No handler for field: ${fieldName}`);
    }
  }

  protected updateOutput(
    resultElement: HTMLInputElement,
    resultText: string,
  ): void {
    resultElement.value = resultText;

    if (resultText === UI_MESSAGES.NO_DISCIPLINE) return;

    historyService.addRecord(resultText);
    document.dispatchEvent(new CustomEvent("history:updated"));
  }
}

class RoundSpinCollection {
  private controllers: RoundSpinController[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    const elements = document.querySelectorAll<HTMLElement>(SELECTORS.root);
    if (elements.length === 0) return;

    const config = await this.fetchRoundConfig();

    this.controllers = Array.from(elements).map(
      (element) =>
        new RoundSpinController(
          element,
          config.discipline,
          config.weather,
          config.modifier,
        ),
    );
  }

  private async fetchRoundConfig(): Promise<RoundConfig> {
    const endpoints = {
      discipline: "./round/discipline.json",
      weather: "./round/weather.json",
      modifier: "./round/modifier.json",
    };

    const fetchJson = async <T>(url: string): Promise<T> => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.json();
    };

    const [discipline, weather, modifier] = await Promise.all([
      fetchJson<Discipline>(endpoints.discipline),
      fetchJson<string[]>(endpoints.weather),
      fetchJson<Modifier[]>(endpoints.modifier),
    ]);

    return { discipline, weather, modifier };
  }

  public destroy() {
    this.controllers.forEach((c) => c.destroy());
    this.controllers = [];
  }
}

export default RoundSpinCollection;
