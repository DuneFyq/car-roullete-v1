interface RecordItem {
  id: string;
  result: string;
  timestamp: number;
}

export type HistoryRecord = RecordItem;
export type CardRecord = RecordItem;

class RecordService<T extends RecordItem> {
  private records: T[] = [];
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
    this.loadFromStorage(); 
  }

  public addRecord(resultText: string): void {
    const newRecord: T = {
      id: crypto.randomUUID(),
      result: resultText,
      timestamp: Date.now(),
    } as T;

    this.records.unshift(newRecord);
    this.saveToStorage();
  }

  public removeRecord(id: string): void {
    this.loadFromStorage();
    this.records = this.records.filter((e) => e.id !== id);
    this.saveToStorage();
  }

  public getRecords(): T[] {
    return this.records;
  }

  private saveToStorage(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.records));
  }

  public loadFromStorage(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.records = JSON.parse(saved);
      } catch (error) {
        console.error(`Ошибка парсинга данных из ${this.storageKey}:`, error);
        this.records = [];
      }
    }
  }

  public clearStorage(): void {
    localStorage.removeItem(this.storageKey);
    this.records = [];
  }
}

export const historyService = new RecordService<HistoryRecord>("spin_history");
export const cardService = new RecordService<CardRecord>("available_cards");