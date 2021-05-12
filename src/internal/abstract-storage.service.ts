import {
  IEntry,
  IRxStorage,
  IEntryChange,
  FilterType,
  IEntrySnapshot,
} from './interfaces';
import { Subject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export class Entry implements IEntry {
  constructor(public key: string, private storage: IRxStorage) {}

  get item() {
    return this.storage.getItem(this.key);
  }

  set item(value: any) {
    this.storage.setItem(this.key, value);
  }

  get exists() {
    return this.storage.hasItem(this.key);
  }

  remove(): void {
    this.storage.removeItem(this.key);
  }
}

export class EntrySnapshot implements IEntrySnapshot {
  constructor(public key: string, public item: any, public exists: boolean) {}
}

export abstract class RxAbstractStorage implements IRxStorage {
  private entryChangeSubject: Subject<IEntryChange>;
  private entryRemovedSubject: Subject<IEntrySnapshot>;

  constructor(private storage: Storage, private prefix?: string) {
    this.entryChangeSubject = new Subject();
    this.entryRemovedSubject = new Subject();
  }

  onItemChanged(keyOrKeys?: string | string[]): Observable<IEntryChange> {
    let observable: Observable<IEntryChange> = this.entryChangeSubject;
    if (typeof keyOrKeys === 'string') {
      observable = observable.pipe(filter((x) => keyOrKeys === x.key));
    } else if (Array.isArray(keyOrKeys)) {
      observable = observable.pipe(filter((x) => keyOrKeys.includes(x.key)));
    }
    return observable;
  }

  onItemRemoved(keyOrKeys?: string | string[]): Observable<IEntrySnapshot> {
    let observable: Observable<IEntrySnapshot> = this.entryRemovedSubject;
    if (typeof keyOrKeys === 'string') {
      observable = observable.pipe(filter((x) => keyOrKeys === x.key));
    } else if (Array.isArray(keyOrKeys)) {
      observable = observable.pipe(filter((x) => keyOrKeys.includes(x.key)));
    }
    return observable;
  }

  hasItem(key: string) {
    return !!this.storage.getItem(this.insertPrefix(key));
  }

  getItem<T = any>(key: string): T {
    let aux: any = this.storage.getItem(this.insertPrefix(key));
    if (aux) {
      aux = JSON.parse(aux);
    }
    return aux;
  }

  setItem(key: string, newItem: any) {
    const oldItem = this.getItem(key);
    this.storage.setItem(this.insertPrefix(key), JSON.stringify(newItem));
    this.entryChangeSubject.next({ key, oldItem, newItem });
  }

  keys(filter?: FilterType): string[] {
    let keys = Object.keys(this.storage)
      .filter((key) => this.hasPrefix(key))
      .map((key) => this.removePrefix(key));
    if (filter) {
      keys = keys.filter(filter);
    }
    return keys;
  }

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
    const keys = this.keys(filter);
    const size = keys.length;
    const items = new Array(size);
    for (let i = 0; i < size; ++i) {
      items[i] = this.getItem(keys[i]);
    }
    return items;
  }

  *itemsIterator(filter?: FilterType): IterableIterator<any> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.getItem(key);
    }
  }

  entries(filter?: FilterType): IEntry[] {
    const keys = this.keys(filter);
    const size = keys.length;
    const entries = new Array<IEntry>(size);
    for (let i = 0; i < size; ++i) {
      entries[i] = this.entry(keys[i]);
    }
    return entries;
  }

  *entriesIterator(filter?: FilterType): IterableIterator<IEntry> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.entry(key);
    }
  }

  entriesSnapshot(filter?: FilterType): IEntrySnapshot[] {
    const keys = this.keys(filter);
    const size = keys.length;
    const entries = new Array<IEntrySnapshot>(size);
    for (let i = 0; i < size; ++i) {
      entries[i] = this.entrySnapshot(keys[i]);
    }
    return entries;
  }

  *entriesSnapshotIterator(
    filter?: FilterType
  ): IterableIterator<IEntrySnapshot> {
    const keys = this.keysIterator(filter);
    for (const key of keys) {
      yield this.entrySnapshot(key);
    }
  }

  entry(key: string): IEntry {
    return new Entry(key, this);
  }

  entrySnapshot(key: string): IEntrySnapshot {
    return new EntrySnapshot(key, this.getItem(key), this.hasItem(key));
  }

  removeItem(key: string) {
    const entry = this.entrySnapshot(key);
    this.storage.removeItem(this.insertPrefix(key));
    this.entryRemovedSubject.next(entry);
  }

  clear(filter?: FilterType) {
    const entries =
      !filter && !this.entryRemovedSubject.observers.length
        ? null
        : this.entriesSnapshot(filter);
    if (!filter) {
      this.storage.clear();
    } else if (entries) {
      for (const entry of entries) {
        this.storage.removeItem(entry.key);
      }
    }

    if (entries && this.entryRemovedSubject.observers.length) {
      for (const entry of entries) {
        this.entryRemovedSubject.next(entry);
      }
    }
  }

  protected insertPrefix(key: string): string {
    return (this.prefix ?? '') + '.' + key;
  }

  protected removePrefix(key: string): string {
    return key.slice(((this.prefix ?? '') + '.').length);
  }

  protected hasPrefix(key: string): boolean {
    return key.startsWith((this.prefix ?? '') + '.');
  }
}
