import { IRxStorage } from "../src/internal/interfaces";
import { RxStorage } from "../src/internal/rx-storage";

let STORAGE_ID = 0;

export function createTests(name: string, source: Storage) {
  const storageFactory: (prefix?: string, useUnique?: boolean) => IRxStorage = (
    prefix = "",
    useUnique = true,
  ) => {
    if (useUnique) {
      prefix = `${++STORAGE_ID}-${prefix}`;
    }

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
      expect(storage.length === 1).toBeTruthy();

      scoped.setItem("test", 3);
      expect(storage.length === scoped.length).toBeFalsy();
      expect(storage.length === 2).toBeTruthy();

      storage.setItem("nova chave", 4);
      expect(storage.length === scoped.length).toBeFalsy();
      expect(storage.length === 3).toBeTruthy();
      expect(scoped.length === 1).toBeTruthy();

      using storageWithSameScopePrefix = storageFactory("scope");
      expect(storageWithSameScopePrefix.length === 0).toBeTruthy();
    });

    test("Entry", () => {
      using storage = storageFactory("host");

      storage.setItem("test", 1);
      storage.setItem("test", 2);
      storage.setItem("test2", 3);
      expect(storage.length === 2).toBeTruthy();

      let entry = storage.entry("test");
      expect(entry.exists).toBeTruthy();
      expect(entry.get() === 2).toBeTruthy();

      entry.set(22);
      expect(entry.exists).toBeTruthy();
      expect(entry.get() === 22).toBeTruthy();
      expect(entry.get() === storage.getItem("test")).toBeTruthy();
      expect(storage.length === 2).toBeTruthy();

      entry.remove();
      expect(!entry.exists).toBeTruthy();
      expect(entry.get() === null).toBeTruthy();
      expect(entry.get() === storage.getItem("test")).toBeTruthy();
      expect(storage.length === 1).toBeTruthy();

      entry.set(23);
      expect(entry.exists).toBeTruthy();
      expect(entry.get() === 23).toBeTruthy();
      expect(entry.get() === storage.getItem("test")).toBeTruthy();
      expect(storage.length === 2).toBeTruthy();

      entry = storage.entry("new entry");
      expect(!entry.exists).toBeTruthy();
      expect(entry.get() === null).toBeTruthy();
      expect(entry.get() === storage.getItem("new entry")).toBeTruthy();
      expect(storage.length === 2).toBeTruthy();

      entry.set("new value");
      expect(entry.exists).toBeTruthy();
      expect(entry.get() === "new value").toBeTruthy();
      expect(entry.get() === storage.getItem("new entry")).toBeTruthy();
      expect(storage.length === 3).toBeTruthy();

      storage.removeItem("new entry");
      expect(!storage.hasItem("new entry")).toBeTruthy();
      expect(!entry.exists).toBeTruthy();
      expect(entry.get() === null).toBeTruthy();
      expect(entry.get() === storage.getItem("new entry")).toBeTruthy();
      expect(storage.length === 2).toBeTruthy();
    });

    test("Bulk events - single", (cb) => {
      const storage = storageFactory("host");

      let times = 3;
      let counter = 0;
      let terminated = false;

      storage.watchBulk("key1").subscribe({
        next: (events) => {
          expect(events.every((x) => x.key === "key1")).toBeTruthy();
          expect(events.length === 5).toBeTruthy();
          expect(events.at(0)?.newItem === 0).toBeTruthy();
          expect(events.at(events.length - 1)?.newItem === 4).toBeTruthy();

          if (terminated) {
            storage.dispose();
          }
        },
        complete: () => {
          cb();
        },
      });

      const fn = () => {
        ++counter;

        for (let i = 0; i < 5; ++i) {
          storage.setItem("key1", i);
          storage.setItem("key2", i);
        }

        if (counter >= times) {
          terminated = true;
          return;
        }

        setTimeout(fn, 20);
      };

      fn();
    });

    test("Bulk events - multiple", (cb) => {
      const storage = storageFactory("host");

      let times = 3;
      let counter = 0;
      let terminated = false;

      storage.watchBulk(["key1", "key2"]).subscribe({
        next: (events) => {
          expect(
            events.every((x) => ["key1", "key2"].includes(x.key)),
          ).toBeTruthy();
          expect(events.some((x) => x.key === "key1")).toBeTruthy();
          expect(events.some((x) => x.key === "key2")).toBeTruthy();
          expect(events.length === 10).toBeTruthy();
          expect(events.at(0)?.newItem === 0).toBeTruthy();
          expect(events.at(events.length - 1)?.newItem === 4).toBeTruthy();

          if (terminated) {
            storage.dispose();
          }
        },
        complete: () => {
          cb();
        },
      });

      const fn = () => {
        ++counter;

        for (let i = 0; i < 5; ++i) {
          storage.setItem("key1", i);
          storage.setItem("key2", i);
          storage.setItem("key3", i);
        }

        if (counter >= times) {
          terminated = true;
          return;
        }

        setTimeout(fn, 20);
      };

      fn();
    });
  });
}
