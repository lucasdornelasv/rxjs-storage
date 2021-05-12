import { RxAbstractStorage } from './abstract-storage.service';

class MemoryStorage implements Storage {
  [name: string]: any;

  private _length = 0;

  get length() {
    return this._length;
  }

  clear(): void {
    const keys = Object.keys(this);
    keys.forEach((key) => {
      delete this[key];
    });
    this._length = 0;
  }

  getItem(key: string): string {
    return this[key];
  }

  key(index: number): string {
    return Object.keys(this)[index];
  }

  removeItem(key: string): void {
    delete this[key];
    --this._length;
  }

  setItem(key: string, value: string): void {
    this[key] = value;
    ++this._length;
  }
}

export class RxMemoryStorage extends RxAbstractStorage {
  constructor(prefix?: string) {
    super(
      (() => {
        if (!globalThis.memoryStorage) {
          globalThis.memoryStorage = new MemoryStorage();
        }

        return globalThis.memoryStorage;
      })(),
      prefix
    );
  }
}
