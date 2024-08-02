import {
  FilterType,
  IEntry,
  EntryChangeEvent,
  IEntrySnapshot,
  IRxStorage,
} from "./interfaces";
import { Observable } from "rxjs";
import { distinctUntilChanged, filter, map, startWith } from "rxjs/operators";
import {
  handleFilter,
  handleKeyOrKeys,
  hasPrefix,
  insertPrefix,
} from "./helpers";

export class Entry<T = any> implements IEntry<T> {
  constructor(
    public key: string,
    private storage: IRxStorage,
  ) {}

  get item() {
    return this.get();
  }

  set item(value: any) {
    this.set(value);
  }

  get exists() {
    return this.storage.hasItem(this.key);
  }

  set(value: T): void {
    this.storage.setItem(this.key, value);
  }

  get(): T {
    return this.storage.getItem<T>(this.key);
  }

  remove(): void {
    this.storage.removeItem(this.key);
  }

  stream(): Observable<T> {
    return this.watch().pipe(
      map((x) => x.newItem),
      startWith(this.get()),
      distinctUntilChanged(),
    );
  }

  watch(): Observable<EntryChangeEvent<T>> {
    return this.storage.watch(this.key);
  }

  onChanged(): Observable<EntryChangeEvent<T>> {
    return this.storage.onItemChanged(this.key);
  }

  onRemoved(): Observable<EntryChangeEvent<T>> {
    return this.storage.onItemRemoved(this.key);
  }
}

export class EntrySnapshot<T = any> implements IEntrySnapshot<T> {
  constructor(
    public key: string,
    public item: any,
    public exists: boolean,
  ) {}
}

export abstract class RxAbstractStorage implements IRxStorage {
  public readonly prefix: string;

  get length() {
    return this.keys().length;
  }

  protected _disposed = false;

  get disposed() {
    return this._disposed;
  }

  constructor(prefix?: string) {
    this.prefix = prefix ?? "";
  }

  abstract watch<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;

  abstract onItemChanged<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;

  abstract onItemRemoved<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>>;

  abstract hasItem(key: string): boolean;

  abstract getItem<T = any>(key: string): T;

  getItemByIndex<T = any>(index: number): T {
    return this.getItem(this.key(index));
  }

  abstract setItem(key: string, newItem: any): void;

  key(index: number): string | null {
    return this.keys().at(index);
  }

  abstract keys(): string[];

  *keysIterator(filter?: FilterType): IterableIterator<string> {
    const keys = this.keys();
    if (filter) {
      for (const key of keys) {
        if (filter(key)) {
          yield key;
        }
      }
    } else {
      for (const key of keys) {
        yield key;
      }
    }
  }

  items(filter?: FilterType): any[] {
    return Array.from(this.itemsIterator(filter));
  }

  *itemsIterator(filter?: FilterType): IterableIterator<any> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.getItem(key);
    }
  }

  entries(filter?: FilterType): IEntry[] {
    return Array.from(this.entriesIterator(filter));
  }

  *entriesIterator(filter?: FilterType): IterableIterator<IEntry> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.entry(key);
    }
  }

  entriesSnapshot(filter?: FilterType): IEntrySnapshot[] {
    return Array.from(this.entriesSnapshotIterator(filter));
  }

  *entriesSnapshotIterator(
    filter?: FilterType,
  ): IterableIterator<IEntrySnapshot> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.entrySnapshot(key);
    }
  }

  entry<T = any>(key: string): IEntry<T> {
    return new Entry<T>(key, this);
  }

  entrySnapshot<T = any>(key: string): IEntrySnapshot<T> {
    return new EntrySnapshot<T>(key, this.getItem<T>(key), this.hasItem(key));
  }

  abstract removeItem(key: string): void;

  abstract clear(filter?: FilterType): void;

  scope(prefix: string): IRxStorage {
    return new RxScopeStorage(this, prefix);
  }

  abstract clone(): IRxStorage;

  abstract dispose(): void;

  [Symbol.dispose]() {
    this.dispose();
  }
}

class RxScopeStorage extends RxAbstractStorage {
  constructor(
    private source: IRxStorage,
    prefix?: string,
  ) {
    super(prefix);
  }

  watch<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>> {
    const { prefix } = this;
    keyOrKeys = handleKeyOrKeys(prefix, keyOrKeys);

    let observable = this.source.watch<T>(keyOrKeys);

    if (!keyOrKeys) {
      observable = observable.pipe(filter((x) => hasPrefix(prefix, x.key)));
    }

    return observable;
  }

  onItemChanged<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent> {
    const { prefix } = this;
    keyOrKeys = handleKeyOrKeys(prefix, keyOrKeys);

    let observable = this.source.onItemChanged<T>(keyOrKeys);

    if (!keyOrKeys) {
      observable = observable.pipe(filter((x) => hasPrefix(prefix, x.key)));
    }

    return observable;
  }

  onItemRemoved<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent> {
    const { prefix } = this;
    keyOrKeys = handleKeyOrKeys(prefix, keyOrKeys);

    let observable = this.source.onItemRemoved<T>(keyOrKeys);

    if (!keyOrKeys) {
      observable = observable.pipe(filter((x) => hasPrefix(prefix, x.key)));
    }

    return observable;
  }

  hasItem(key: string) {
    return this.source.hasItem(insertPrefix(this.prefix, key));
  }

  getItem<T = any>(key: string): T {
    return this.source.getItem(insertPrefix(this.prefix, key));
  }

  setItem(key: string, newItem: any) {
    this.source.setItem(insertPrefix(this.prefix, key), newItem);
  }

  keys(): string[] {
    return this.source.keys().filter(handleFilter(this.prefix));
  }

  keysIterator(filter?: FilterType): IterableIterator<string> {
    return this.source.keysIterator(handleFilter(this.prefix, filter));
  }

  removeItem(key: string): void {
    this.source.removeItem(insertPrefix(this.prefix, key));
  }

  clear(filter?: FilterType): void {
    this.source.clear(handleFilter(this.prefix, filter));
  }

  clone(): IRxStorage {
    return new RxScopeStorage(this.source, this.prefix);
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this._disposed = true;
  }
}
