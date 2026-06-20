export function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Возвращает случайный элемент из любого итерируемого объекта (Iterable).
 * 
 * Подходит для: Map.keys(), Map.values(), Map.entries(), Set, строки, генераторов,
 * NodeList и любого другого объекта, реализующего протокол итерации.
 * 
 * **Важно:** создаёт промежуточный массив через `Array.from()`, что может быть
 * накладно для очень больших коллекций.
 * 
 * @param items - Любой итерируемый объект (Iterable)
 * @returns Случайный элемент типа T
 * @throws {Error} Если коллекция пустая
 * 
 * @example
 * const map = new Map([['a', 1], ['b', 2]]);
 * const key = randomFromIterable(map.keys());   // 'a' | 'b'
 * const value = randomFromIterable(map.values()); // 1 | 2
 * 
 * @example
 * const set = new Set([10, 20, 30]);
 * const num = randomFromIterable(set); // 10 | 20 | 30
 */
export function randomFromIterable<T>(items: Iterable<T>): T {
  const arr = Array.from(items);
  if (arr.length === 0) throw new Error("Empty iterable");
  return arr[randomIntInRange(0, arr.length - 1)];
}

/**
 * Возвращает случайный элемент из массива.
 * 
 * **Когда использовать:** только для массивов. Это самый быстрый вариант —
 * не создаёт копию массива, а обращается по индексу напрямую.
 * 
 * Не подходит для Map, Set и других Iterable — используйте {@link randomFromIterable}.
 * 
 * @param items - Массив элементов (readonly — функция не модифицирует исходный массив)
 * @returns Случайный элемент массива типа T
 * @throws {Error} Если массив пустой
 * 
 * @example
 * const colors = ['red', 'green', 'blue'];
 * const color = randomFromArray(colors); // 'red' | 'green' | 'blue'
 * 
 * @example
 * const empty: string[] = [];
 * randomFromArray(empty); // ❌ Error: Empty array
 */
export function randomFromArray<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error("Empty array");
  return items[randomIntInRange(0, items.length - 1)];
}

/**
 * Возвращает случайный ключ из обычного объекта (Record / object literal).
 * 
 * **Когда использовать:** для plain-объектов `{ a: 1, b: 2 }`.
 * 
 * **Не подходит для Map** — у Map нет строковых ключей в привычном смысле,
 * используйте {@link randomFromIterable} с `map.keys()`.
 * 
 * @param object - Обычный JS-объект с произвольными полями
 * @returns Случайный ключ объекта (всегда string, даже если ключи числовые)
 * @throws {Error} Если объект не содержит ключей
 * 
 * @example
 * const config = { width: 100, height: 200, depth: 300 };
 * const param = randomKeyFromObject(config); // 'width' | 'height' | 'depth'
 * const value = config[param]; // 100 | 200 | 300
 */
export function randomKeyFromObject<T extends object>(object: T): string & keyof T {
  const keys = Object.keys(object) as (string & keyof T)[];
  if (keys.length === 0) throw new Error("Empty object");
  return keys[randomIntInRange(0, keys.length - 1)];
}