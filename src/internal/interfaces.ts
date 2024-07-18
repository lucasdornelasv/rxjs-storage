import { Observable } from "rxjs";

export interface IEntry<T = any> {
  readonly key: string;
  item: T;
  readonly exists: boolean;
  set(value: T): void;
  get(): T;
  remove(): void;
  onChanged(): Observable<IEntryChange<T>>;
  onRemoved(): Observable<IEntrySnapshot<T>>;
}

export interface IEntrySnapshot<T = any> {
  readonly key: string;
  readonly item: T;
  readonly exists: boolean;
}

export interface IEntryChange<T = any> {
  key: string;
  oldItem: T;
  newItem: T;
}

export type FilterType = (key: string) => boolean;

export interface IRxStorage extends Disposable {
  readonly prefix: string;

  readonly length: number;
  onItemChanged(keyOrKeys?: string | string[]): Observable<IEntryChange>;
  onItemRemoved(keyOrKeys?: string | string[]): Observable<IEntrySnapshot>;
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
