import { SessionStorageService } from '../src/session';

const StorageService = SessionStorageService;

describe('Session Storage Service', () => {
  test('Should Create Instance', () => {
    const storageService = new StorageService();

    expect(storageService).toBeInstanceOf(StorageService);
    expect(storageService.keys().length).toEqual(0);
    expect(storageService.items().length).toEqual(0);
    expect(storageService.entries().length).toEqual(0);
  });

  test('Should changed keys count', () => {
    const storageService = new StorageService('keys');
    expect(storageService.keys().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.keys().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.keys().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.keys().length).toEqual(3);
  });

  test('Should changed items count', () => {
    const storageService = new StorageService('items');
    expect(storageService.items().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.items().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.items().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.items().length).toEqual(3);
  });

  test('Should changed entries count', () => {
    const storageService = new StorageService('entries');
    expect(storageService.entries().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.entries().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.entries().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.entries().length).toEqual(3);
  });

  test('Should changed entriesSnapshot count', () => {
    const storageService = new StorageService('entriesSnapshot');
    expect(storageService.entriesSnapshot().length).toEqual(0);

    storageService.setItem('test', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(1);

    storageService.setItem('test2', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(2);

    storageService.setItem('test3', 'test');
    expect(storageService.entriesSnapshot().length).toEqual(3);
  });

  test('Should inserted keys', () => {
    const storageService = new StorageService('inserted keys');

    for (let i = 0; i < 3; ++i) {
      const key = 'test' + i;
      expect(storageService.hasItem(key)).toBeFalsy();

      storageService.setItem(key, 'value');
      expect(storageService.hasItem(key)).toBeTruthy();
    }
  });

  test('Should inserted items', () => {
    const storageService = new StorageService('inserted items');

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
