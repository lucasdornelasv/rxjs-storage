import { subscribeOn } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

const testScheduler = new TestScheduler((actual, expected) => {
  // asserting the two objects are equal
  // e.g. using chai.
  expect(actual).toBe(expected);
});

import { MemoryStorageService } from '../src/memory';

describe('Memory Storage Service', () => {
  test('Should Create Instance', () => {
    expect(globalThis.memoryStorage).toBeUndefined();

    const storageService = new MemoryStorageService();

    expect(storageService).toBeInstanceOf(MemoryStorageService);
    expect(storageService.keys().length).toEqual(0);
    expect(storageService.items().length).toEqual(0);
    expect(storageService.entries().length).toEqual(0);

    expect(globalThis.memoryStorage).toBeDefined();
  });

  test('Should changed keys count', () => {
    const storageService = new MemoryStorageService('keys');
    expect(storageService.keys().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.keys().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.keys().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.keys().length).toEqual(3);
  });

  test('Should changed items count', () => {
    const storageService = new MemoryStorageService('items');
    expect(storageService.items().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.items().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.items().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.items().length).toEqual(3);
  });

  test('Should changed entries count', () => {
    const storageService = new MemoryStorageService('entries');
    expect(storageService.entries().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.entries().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.entries().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.entries().length).toEqual(3);
  });

  test('Should changed entriesSnapshot count', () => {
    const storageService = new MemoryStorageService('entriesSnapshot');
    expect(storageService.entriesSnapshot().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(3);
  });

  test('Should inserted keys', () => {
    const storageService = new MemoryStorageService('inserted keys');

    for (let i = 0; i < 3; ++i) {
      const key = 'test' + i;
      expect(storageService.hasItem(key)).toBeFalsy();

      storageService.setItem(key, 'value');
      expect(storageService.hasItem(key)).toBeTruthy();
    }
  });

  test('Should inserted items', () => {
    const storageService = new MemoryStorageService('inserted items');

    for (let i = 0; i < 3; ++i) {
      const key = 'test' + i;
      let value = 'value';

      expect(storageService.getItem(key)).not.toEqual(value);

      storageService.setItem(key, value);
      expect(storageService.getItem(key)).toEqual(value);

      value = 'value' + i;
      storageService.setItem(key, value);
      expect(storageService.getItem(key)).toEqual(value);

      value = 'value' + i;
      storageService.setItem(key, value);
      expect(storageService.getItem(key)).toEqual(value);
    }
  });
});
