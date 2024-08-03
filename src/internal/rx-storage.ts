import { IRxStorage, EntryChangeEvent, FilterType } from "./interfaces";
import {
  Subject,
  Observable,
  Subscription,
  fromEvent,
  merge,
  asapScheduler,
} from "rxjs";
import { filter, map } from "rxjs/operators";
import { RxAbstractStorage } from "./abstract-storage";
import { hasPrefix, insertPrefix, removePrefix } from "./helpers";
import { setupNativeListeners } from "./native-storage";
import { bufferTick } from "./rx-operators/bufferTick";

export class RxStorage extends RxAbstractStorage {
  private _entriesChangeSubject: Subject<EntryChangeEvent[]>;
  private get entriesChangeSubject() {
    if (!this._entriesChangeSubject) {
      this._entriesChangeSubject = new Subject();
    }

    return this._entriesChangeSubject;
  }

  private _subscription: Subscription;

  constructor(
    private storage: Storage,
    prefix?: string,
  ) {
    super(prefix);
  }

  override watchBulk<T = any>(
    keyOrKeys?: string | string[],
  ): Observable<ReadonlyArray<EntryChangeEvent<T>>> {
    this._setupGlobalObservers();

    let filterEvent: (event: EntryChangeEvent<T>) => boolean;

    if (typeof keyOrKeys === "string") {
      filterEvent = (x) => x.key === keyOrKeys;
    } else if (Array.isArray(keyOrKeys)) {
      filterEvent = (x) => keyOrKeys.includes(x.key);
    }

    let observable: Observable<EntryChangeEvent<T>[]> =
      this.entriesChangeSubject;

    if (filterEvent) {
      observable = observable.pipe(
        map((events) => events.filter(filterEvent)),
        filter((events) => events.length > 0),
      );
    }

    return observable;
  }

  *keysIterator(filter?: FilterType): IterableIterator<string> {
    const keys = Object.keys(this.storage);
    if (filter) {
      for (let key of keys) {
        if (!hasPrefix(this.prefix, key)) {
          continue;
        }

        key = removePrefix(this.prefix, key);
        if (filter(key)) {
          yield key;
        }
      }
    } else {
      for (let key of keys) {
        if (!hasPrefix(this.prefix, key)) {
          continue;
        }

        key = removePrefix(this.prefix, key);
        yield key;
      }
    }
  }

  hasItem(key: string) {
    key = insertPrefix(this.prefix, key);
    return !!(key in this.storage);
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

    this._entriesChangeSubject?.complete();
    this._entriesChangeSubject?.unsubscribe();
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

    let observable: Observable<StorageEvent> = setupNativeListeners(
      this.storage,
    );

    if (this.storage === globalThis.localStorage) {
      observable = merge(
        fromEvent<StorageEvent>(globalThis.window, "storage"),
        observable,
      );
    }

    this._subscription = observable
      .pipe(
        filter((e: StorageEvent) => {
          const self = thisRef.deref();
          if (self.storage !== e.storageArea) {
            return false;
          }

          if (e.key === null || !hasPrefix(self.prefix, e.key)) {
            return false;
          }

          return true;
        }),
        map((e: StorageEvent) => {
          const self = thisRef.deref();

          const key = removePrefix(self.prefix, e.key);

          const oldItem = self.handleItem(e.oldValue);
          let newItem: any;
          let removed: boolean;

          if (e.oldValue === null || e.newValue !== null) {
            newItem = self.handleItem(e.newValue);
            removed = false;
          } else {
            newItem = null;
            removed = true;
          }

          return {
            key,
            newItem,
            oldItem,
            removed,
          } as EntryChangeEvent;
        }),
        bufferTick(asapScheduler),
      )
      .subscribe((events) => {
        const self = thisRef.deref();
        self.entriesChangeSubject.next(events);
      });
  }
}
