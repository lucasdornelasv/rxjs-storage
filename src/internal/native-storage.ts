import { Subject } from "rxjs";
import { wrap } from "./helpers";

const storageEventsManagerMap = new WeakMap<Storage, Subject<StorageEvent>>();
export function setupNativeListeners(storage: Storage) {
  let subject = storageEventsManagerMap.get(storage);
  if (!subject) {
    _setupStorageEvents(storage.__proto__ ?? storage);

    subject = new Subject();
    storageEventsManagerMap.set(storage, subject);
  }

  return subject;
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
  const subject = storageEventsManagerMap.get(storage);
  if (!subject) {
    return;
  }

  subject.next({
    storageArea: storage,
    key,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  } as any);
}
