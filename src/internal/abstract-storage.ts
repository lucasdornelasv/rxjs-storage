import {
  FilterType,
  IEntry,
  IEntryChange,
  IEntrySnapshot,
  IRxStorage,
} from "./interfaces";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";

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

  onChanged(): Observable<IEntryChange<T>> {
    return this.storage.onItemChanged(this.key);
  }

  onRemoved(): Observable<IEntrySnapshot<T>> {
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

  abstract onItemChanged(
    keyOrKeys?: string | string[],
  ): Observable<IEntryChange>;

  abstract onItemRemoved(
    keyOrKeys?: string | string[],
  ): Observable<IEntrySnapshot>;

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

  protected insertPrefix(key: string): string {
    return (this.prefix ?? "") + "." + key;
  }

  protected removePrefix(key: string): string {
    return key.slice(((this.prefix ?? "") + ".").length);
  }

  protected hasPrefix(key: string): boolean {
    return key?.startsWith((this.prefix ?? "") + ".") ?? false;
  }
}

class RxScopeStorage extends RxAbstractStorage {
  constructor(
    private source: IRxStorage,
    prefix?: string,
  ) {
    super(prefix);
  }

  onItemChanged(keyOrKeys?: string | string[]): Observable<IEntryChange> {
    keyOrKeys = this.handleKeyOrKeys(keyOrKeys);

    let observable = this.source.onItemChanged(keyOrKeys);

    if (!keyOrKeys) {
      observable = observable.pipe(filter((x) => this.hasPrefix(x.key)));
    }

    return observable;
  }

  onItemRemoved(keyOrKeys?: string | string[]): Observable<IEntrySnapshot> {
    keyOrKeys = this.handleKeyOrKeys(keyOrKeys);

    let observable = this.source.onItemRemoved(keyOrKeys);

    if (!keyOrKeys) {
      observable = observable.pipe(filter((x) => this.hasPrefix(x.key)));
    }

    return observable;
  }

  hasItem(key: string) {
    return this.source.hasItem(this.insertPrefix(key));
  }

  getItem<T = any>(key: string): T {
    return this.source.getItem(this.insertPrefix(key));
  }

  setItem(key: string, newItem: any) {
    this.source.setItem(this.insertPrefix(key), newItem);
  }

  keys(): string[] {
    return this.source.keys().filter(this.handleFilter());
  }

  keysIterator(filter?: FilterType): IterableIterator<string> {
    return this.source.keysIterator(this.handleFilter(filter));
  }

  removeItem(key: string): void {
    this.source.removeItem(this.insertPrefix(key));
  }

  clear(filter?: FilterType): void {
    this.source.clear(this.handleFilter(filter));
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

  private handleFilter(filter?: FilterType): FilterType {
    return (key) => {
      if (!this.hasPrefix(key)) {
        return false;
      }

      if (!filter) {
        return true;
      }

      return filter(key);
    };
  }

  private handleKeyOrKeys(keyOrKeys?: string | string[]) {
    if (Array.isArray(keyOrKeys)) {
      keyOrKeys = keyOrKeys.map((key) => this.insertPrefix(key));
    } else if (typeof keyOrKeys === "string") {
      keyOrKeys = this.insertPrefix(keyOrKeys);
    }

    return keyOrKeys;
  }
}
