import { Observable } from "rxjs";

export interface IEntry<T = any> {
  readonly key: string;
  item: T;
  readonly exists: boolean;
  set(value: T): void;
  get(): T;
  remove(): void;
  stream(): Observable<T>;
  watch(): Observable<EntryChangeEvent<T>>;
  onChanged(): Observable<EntryChangeEvent<T>>;
  onRemoved(): Observable<EntryChangeEvent<T>>;
}

export interface IEntrySnapshot<T = any> {
  readonly key: string;
  readonly item: T;
  readonly exists: boolean;
}

export interface EntryChangeEvent<T = any> {
  readonly key: string;
  readonly oldItem: T;
  readonly newItem: T;
  readonly removed: boolean;
}

export type FilterType = (key: string) => boolean;

export interface IRxStorage extends Disposable {
  readonly prefix: string;

  readonly length: number;

  watchBulk<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<ReadonlyArray<EntryChangeEvent<T>>>;
  watch<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;
  onItemChanged<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;
  onItemRemoved<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;
  hasItem(key: string): boolean;
  getItem<T = any>(key: string): T;
  getItemByIndex<T = any>(index: number): T;
  setItem(key: string, item: any);
  key(index: number): string | null;
  keys(): string[];
  keysIterator(filter?: FilterType): IterableIterator<string>;
  items(filter?: FilterType): any[];
  itemsIterator(filter?: FilterType): IterableIterator<any>;
  entries(filter?: FilterType): IEntry[];
  entriesIterator(filter?: FilterType): IterableIterator<IEntry>;
  entriesSnapshot(filter?: FilterType): IEntrySnapshot[];
  entriesSnapshotIterator(
    filter?: FilterType,
  ): IterableIterator<IEntrySnapshot>;
  entry<T = any>(key: string): IEntry<T>;
  entrySnapshot<T = any>(key: string): IEntrySnapshot<T>;
  removeItem(key: string);
  clear(filter?: FilterType);
  scope(prefix: string): IRxStorage;
  clone(): IRxStorage;

  readonly disposed: boolean;
  dispose();
}
