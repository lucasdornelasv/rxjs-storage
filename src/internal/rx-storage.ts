import {
  IRxStorage,
  IEntryChange,
  FilterType,
  IEntrySnapshot,
} from "./interfaces";
import { Subject, Observable, Subscription, fromEvent, merge } from "rxjs";
import { filter } from "rxjs/operators";
import { RxAbstractStorage } from "./abstract-storage";
import { setupNativeListeners, StorageEventsConfig } from "./helpers";

export class RxStorage extends RxAbstractStorage {
  private _entryChangeSubject: Subject<IEntryChange>;
  private get entryChangeSubject() {
    if (!this._entryChangeSubject) {
      this._entryChangeSubject = new Subject();
    }

    return this._entryChangeSubject;
  }

  private _entryRemovedSubject: Subject<IEntrySnapshot>;
  private get entryRemovedSubject() {
    if (!this._entryRemovedSubject) {
      this._entryRemovedSubject = new Subject();
    }

    return this._entryRemovedSubject;
  }

  private storageEventsConfig: StorageEventsConfig;

  private _subscription: Subscription;

  constructor(
    private storage: Storage,
    prefix?: string,
  ) {
    super(prefix);
  }

  onItemChanged(keyOrKeys?: string | string[]): Observable<IEntryChange> {
    this._setupGlobalObservers();

    let observable: Observable<IEntryChange> = this.entryChangeSubject;
    if (typeof keyOrKeys === "string") {
      observable = observable.pipe(filter((x) => keyOrKeys === x.key));
    } else if (Array.isArray(keyOrKeys)) {
      observable = observable.pipe(filter((x) => keyOrKeys.includes(x.key)));
    }
    return observable;
  }

  onItemRemoved(keyOrKeys?: string | string[]): Observable<IEntrySnapshot> {
    this._setupGlobalObservers();

    let observable: Observable<IEntrySnapshot> = this.entryRemovedSubject;
    if (typeof keyOrKeys === "string") {
      observable = observable.pipe(filter((x) => keyOrKeys === x.key));
    } else if (Array.isArray(keyOrKeys)) {
      observable = observable.pipe(filter((x) => keyOrKeys.includes(x.key)));
    }
    return observable;
  }

  keys(): string[] {
    return Object.keys(this.storage)
      .filter((key) => this.hasPrefix(key))
      .map((key) => this.removePrefix(key));
  }

  hasItem(key: string) {
    return !!this.storage.getItem(this.insertPrefix(key));
  }

  setItem(key: string, newItem: any) {
    this.storage.setItem(this.insertPrefix(key), JSON.stringify(newItem));
  }

  getItem<T = any>(key: string): T {
    return this.handleItem(this.storage.getItem(this.insertPrefix(key)));
  }

  removeItem(key: string) {
    this.storage.removeItem(this.insertPrefix(key));
  }

  clear(filter?: FilterType) {
    for (const key of this.keysIterator(filter)) {
      this.storage.removeItem(this.insertPrefix(key));
    }
  }

  clone(): IRxStorage {
    return new RxStorage(this.storage, this.prefix);
  }

  dispose() {
    if (this.disposed) {
      return;
    }

    this._disposed = true;

    this._subscription?.unsubscribe();

    for (const subject of [this.entryChangeSubject, this.entryRemovedSubject]) {
      subject?.complete();
      subject?.unsubscribe();
    }
  }

  private handleItem(value: any) {
    if (value) {
      value = JSON.parse(value);
    }

    return value ?? null;
  }

  private _setupGlobalObservers() {
    if (this._subscription) {
      return;
    }

    const thisRef = new WeakRef(this);

    this.storageEventsConfig = setupNativeListeners(this.storage);

    this._subscription = merge(
      fromEvent(window, "storage"),
      this.storageEventsConfig.changes,
    ).subscribe((e: StorageEvent) => {
      const self = thisRef.deref();
      if (self.storage !== e.storageArea) {
        return;
      }

      if (e.key === null || !self.hasPrefix(e.key)) {
        return;
      }

      const key = self.removePrefix(e.key);

      const oldItem = self.handleItem(e.oldValue);
      if (e.oldValue === null || e.newValue !== null) {
        const newItem = self.handleItem(e.newValue);
        self.entryChangeSubject.next({
          key,
          newItem,
          oldItem,
        });
      } else {
        self.entryRemovedSubject.next({
          key,
          item: oldItem,
          exists: false,
        });
      }
    });
  }
}
