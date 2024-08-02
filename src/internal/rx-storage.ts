import {
  IRxStorage,
  EntryChangeEvent,
  FilterType,
  IEntrySnapshot,
} from "./interfaces";
import { Subject, Observable, Subscription, fromEvent, merge } from "rxjs";
import { filter } from "rxjs/operators";
import { RxAbstractStorage } from "./abstract-storage";
import {
  hasPrefix,
  insertPrefix,
  removePrefix,
  setupNativeListeners,
  StorageEventsConfig,
} from "./helpers";

export class RxStorage extends RxAbstractStorage {
  private _entryChangeSubject: Subject<EntryChangeEvent>;
  private get entryChangeSubject() {
    if (!this._entryChangeSubject) {
      this._entryChangeSubject = new Subject();
    }

    return this._entryChangeSubject;
  }

  private _subscription: Subscription;

  constructor(
    private storage: Storage,
    prefix?: string,
  ) {
    super(prefix);
  }

  watch<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>> {
    this._setupGlobalObservers();

    let observable: Observable<EntryChangeEvent<T>> = this.entryChangeSubject;
    if (typeof keyOrKeys === "string") {
      observable = observable.pipe(filter((x) => keyOrKeys === x.key));
    } else if (Array.isArray(keyOrKeys)) {
      observable = observable.pipe(filter((x) => keyOrKeys.includes(x.key)));
    }

    return observable;
  }

  onItemChanged<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>> {
    return this.watch(keyOrKeys).pipe(filter((x) => !x.removed));
  }

  onItemRemoved<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<EntryChangeEvent<T>> {
    return this.watch(keyOrKeys).pipe(filter((x) => x.removed));
  }

  keys(): string[] {
    return Object.keys(this.storage)
      .filter((key) => hasPrefix(this.prefix, key))
      .map((key) => removePrefix(this.prefix, key));
  }

  hasItem(key: string) {
    return !!this.storage.getItem(insertPrefix(this.prefix, key));
  }

  setItem(key: string, newItem: any) {
    this.storage.setItem(
      insertPrefix(this.prefix, key),
      JSON.stringify(newItem),
    );
  }

  getItem<T = any>(key: string): T {
    return this.handleItem(
      this.storage.getItem(insertPrefix(this.prefix, key)),
    );
  }

  removeItem(key: string) {
    this.storage.removeItem(insertPrefix(this.prefix, key));
  }

  clear(filter?: FilterType) {
    for (const key of this.keysIterator(filter)) {
      this.storage.removeItem(insertPrefix(this.prefix, key));
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

    this._entryChangeSubject?.complete();
    this._entryChangeSubject?.unsubscribe();
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

    const { changes } = setupNativeListeners(this.storage);

    let observable: Observable<StorageEvent> = changes;

    if (this.storage === globalThis.localStorage) {
      observable = merge(
        fromEvent<StorageEvent>(window, "storage"),
        observable,
      );
    }

    this._subscription = observable.subscribe((e: StorageEvent) => {
      const self = thisRef.deref();
      if (self.storage !== e.storageArea) {
        return;
      }

      if (e.key === null || !hasPrefix(self.prefix, e.key)) {
        return;
      }

      const key = removePrefix(self.prefix, e.key);

      const oldItem = self.handleItem(e.oldValue);
      if (e.oldValue === null || e.newValue !== null) {
        const newItem = self.handleItem(e.newValue);
        self.entryChangeSubject.next({
          key,
          newItem,
          oldItem,
          removed: false,
        });
      } else {
        self.entryChangeSubject.next({
          key,
          newItem: null,
          oldItem,
          removed: true,
        });
      }
    });
  }
}
