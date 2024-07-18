import { IRxStorage } from "../src/internal/interfaces";
import { RxStorage } from "../src/internal/rx-storage";

export function createTests(name: string, source: Storage) {
  const storageFactory: (prefix?: string) => IRxStorage = (prefix) => {
    return new RxStorage(source, prefix);
  };

  describe(name, () => {
    test("Should Create Instance", () => {
      using storage = storageFactory();

      expect(storage).toBeInstanceOf(RxStorage);
      expect(storage.keys().length).toEqual(0);
      expect(storage.items().length).toEqual(0);
      expect(storage.entries().length).toEqual(0);
    });

    test("Should Dispose", () => {
      const storage = storageFactory();

      expect(storage.disposed).toBeFalsy();

      storage.dispose();
      expect(storage.disposed).toBeTruthy();
    });

    test("Should changed keys count", () => {
      using storage = storageFactory("keys");
      expect(storage.keys().length).toEqual(0);

      storage.setItem("test", "test");
      expect(storage.keys().length).toEqual(1);

      storage.setItem("test2", "test");
      expect(storage.keys().length).toEqual(2);

      storage.setItem("test3", "test");
      expect(storage.keys().length).toEqual(3);
    });

    test("Should changed items count", () => {
      using storage = storageFactory("items");
      expect(storage.items().length).toEqual(0);

      storage.setItem("test", "test");
      expect(storage.items().length).toEqual(1);

      storage.setItem("test2", "test");
      expect(storage.items().length).toEqual(2);

      storage.setItem("test3", "test");
      expect(storage.items().length).toEqual(3);
    });

    test("Should changed entries count", () => {
      using storage = storageFactory("entries");
      expect(storage.entries().length).toEqual(0);

      storage.setItem("test", "test");
      expect(storage.entries().length).toEqual(1);

      storage.setItem("test2", "test");
      expect(storage.entries().length).toEqual(2);

      storage.setItem("test3", "test");
      expect(storage.entries().length).toEqual(3);
    });

    test("Should changed entriesSnapshot count", () => {
      using storage = storageFactory("entriesSnapshot");
      expect(storage.entriesSnapshot().length).toEqual(0);

      storage.setItem("test", "test");
      expect(storage.entriesSnapshot().length).toEqual(1);

      storage.setItem("test2", "test");
      expect(storage.entriesSnapshot().length).toEqual(2);

      storage.setItem("test3", "test");
      expect(storage.entriesSnapshot().length).toEqual(3);
    });

    test("Should inserted keys", () => {
      using storage = storageFactory("inserted keys");

      for (let i = 0; i < 3; ++i) {
        const key = "test" + i;
        expect(storage.hasItem(key)).toBeFalsy();

        storage.setItem(key, "value");
        expect(storage.hasItem(key)).toBeTruthy();
      }
    });

    test("Should inserted items", () => {
      using storage = storageFactory("inserted items");

      for (let i = 0; i < 3; ++i) {
        const key = "test" + i;
        let value = "value";

        expect(storage.getItem(key)).not.toEqual(value);

        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);

        value = "value" + i;
        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);

        value = "value" + i;
        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);
      }
    });

    test("Should clear", () => {
      using storage = storageFactory("clear");

      for (let i = 0; i < 3; ++i) {
        const key = "test" + i;
        let value = "value";

        expect(storage.getItem(key)).not.toEqual(value);

        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);

        value = "value" + i;
        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);

        value = "value" + i;
        storage.setItem(key, value);
        expect(storage.getItem(key)).toEqual(value);
      }

      using storage2 = storageFactory("aux");
      expect(storage2.length === 0).toBeTruthy();
      expect(storage.length === storage2.length).toBeFalsy();

      const oldCount = storage.length;

      storage2.clear();

      expect(storage.length === oldCount).toBeTruthy();
      expect(storage2.length === 0).toBeTruthy();
      expect(storage.length === storage2.length).toBeFalsy();
    });

    test("Should cloned", () => {
      using storage = storageFactory("clone");

      storage.setItem("test", 1);
      storage.setItem("test", 2);

      using cloned = storage.clone();

      expect(cloned !== storage).toBeTruthy();
      expect(storage.prefix === cloned.prefix).toBeTruthy();
      expect(storage.length === cloned.length).toBeTruthy();

      cloned.setItem("test", 3);

      expect(storage.length === cloned.length).toBeTruthy();
    });

    test("Should scope", () => {
      using storage = storageFactory("host");

      storage.setItem("test", 1);
      storage.setItem("test", 2);

      using scoped = storage.scope("scope");

      expect(scoped !== storage).toBeTruthy();
      expect(storage.prefix === scoped.prefix).toBeFalsy();
      expect(storage.length === scoped.length).toBeFalsy();

      scoped.setItem("test", 3);

      expect(storage.length === scoped.length).toBeFalsy();

      using storageWithSameScopePrefix = storageFactory("scope");
      expect(storageWithSameScopePrefix.length === 0).toBeTruthy();
    });
  });
}
