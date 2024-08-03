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
