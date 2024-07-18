import { asapScheduler, Observable, Subject } from "rxjs";
import { IEntryChange, IEntrySnapshot } from "./interfaces";

export function provideMemoryStorage(): Storage {
  let storage: Storage = globalThis.memoryStorage;

  if (!storage) {
    class MemoryStorage implements Storage {
      [name: string]: any;

      get length() {
        return Object.keys(this).length;
      }

      clear(): void {
        const keys = Object.keys(this);
        keys.forEach((key) => {
          delete this[key];
        });
      }

      getItem(key: string): string {
        return this[key];
      }

      key(index: number): string {
        return Object.keys(this)[index];
      }

      removeItem(key: string): void {
        delete this[key];
      }

      setItem(key: string, value: string): void {
        this[key] = value;
      }
    }

    storage = new MemoryStorage();
    globalThis.memoryStorage = storage;
  }

  return storage;
}

export type StorageEventsConfig = {
  readonly changes: Subject<StorageEvent>;
};

const storageConfigurationMap = new Map<Storage, StorageEventsConfig>();
export function setupNativeListeners(storage: Storage) {
  let config = storageConfigurationMap.get(storage);
  if (!config) {
    _setupStorageEvents(storage.__proto__ ?? storage);

    let subject: Subject<StorageEvent>;

    config = {
      get changes() {
        if (!subject) {
          subject = new Subject();
        }

        return subject;
      },
    };
    storageConfigurationMap.set(storage, config);
  }

  return config;
}

let wrappedNativeFns = false;
function _setupStorageEvents(storagePrototype: any) {
  if (!wrappedNativeFns) {
    wrappedNativeFns = true;

    storagePrototype.setItem = wrap(
      storagePrototype.setItem,
      function (this: Storage, originalFn, key: string, value: any) {
        const oldValue = this.getItem(key) ?? null;

        originalFn.call(this, key, value);

        const newValue = this.getItem(key) ?? null;

        if (oldValue === newValue) {
          return;
        }

        _emitEvent(this, key, oldValue, newValue);
      },
    );

    storagePrototype.removeItem = wrap(
      storagePrototype.removeItem,
      function (this: Storage, originalFn, key: string) {
        const oldValue = this.getItem(key) ?? null;

        originalFn.call(this, key);

        if (oldValue === null) {
          return;
        }

        _emitEvent(this, key, oldValue);
      },
    );

    storagePrototype.clear = wrap(
      storagePrototype.clear,
      function (this: Storage, originalFn) {
        const keys = Object.keys(this);
        for (const key of keys) {
          this.removeItem(key);
        }

        originalFn.call(this);
      },
    );
  }
}

function _emitEvent(
  storage: Storage,
  key: string,
  oldValue?: any,
  newValue?: any,
) {
  const subject = storageConfigurationMap.get(storage)?.changes;
  if (!subject) {
    return;
  }

  asapScheduler.schedule(() => {
    subject.next({
      storageArea: storage,
      key,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
    } as any);
  });
}

function wrap(
  originalFn: Function,
  fn: (originalFn: Function, ...args: any[]) => any,
) {
  return function (this: any, ...args: any[]) {
    return fn.call(this as any, originalFn, ...args);
  };
}
