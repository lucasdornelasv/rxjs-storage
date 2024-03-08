import { RxAbstractStorage } from "../src/internal/abstract-storage.service";
import { RxMemoryStorage } from "../src/internal/memory-storage.service";

interface Type<T> extends Function {
    new (...args: any[]): T;
}

export function createTests<T extends Type<RxAbstractStorage>>(name: string, type: T) {
    const RxStorage = type

describe(name, () => {
  test('Should Create Instance', () => {
    if (type === RxMemoryStorage) {
        expect(globalThis.memoryStorage).toBeUndefined()
    }

    const storageService = new RxStorage()

    expect(storageService).toBeInstanceOf(RxStorage)
    expect(storageService.keys().length).toEqual(0)
    expect(storageService.items().length).toEqual(0)
    expect(storageService.entries().length).toEqual(0)

    if (type === RxMemoryStorage) {
        expect(globalThis.memoryStorage).toBeDefined()
    }
  })

  test('Should changed keys count', () => {
    const storageService = new RxStorage('keys')
    expect(storageService.keys().length).toEqual(0)

    storageService.setItem('test', 'test')
    expect(storageService.keys().length).toEqual(1)

    storageService.setItem('test2', 'test')
    expect(storageService.keys().length).toEqual(2)

    storageService.setItem('test3', 'test')
    expect(storageService.keys().length).toEqual(3)
  })

  test('Should changed items count', () => {
    const storageService = new RxStorage('items')
    expect(storageService.items().length).toEqual(0)

    storageService.setItem('test', 'test')
    expect(storageService.items().length).toEqual(1)

    storageService.setItem('test2', 'test')
    expect(storageService.items().length).toEqual(2)

    storageService.setItem('test3', 'test')
    expect(storageService.items().length).toEqual(3)
  })

  test('Should changed entries count', () => {
    const storageService = new RxStorage('entries')
    expect(storageService.entries().length).toEqual(0)

    storageService.setItem('test', 'test')
    expect(storageService.entries().length).toEqual(1)

    storageService.setItem('test2', 'test')
    expect(storageService.entries().length).toEqual(2)

    storageService.setItem('test3', 'test')
    expect(storageService.entries().length).toEqual(3)
  })

  test('Should changed entriesSnapshot count', () => {
    const storageService = new RxStorage('entriesSnapshot')
    expect(storageService.entriesSnapshot().length).toEqual(0)

    storageService.setItem('test', 'test')
    expect(storageService.entriesSnapshot().length).toEqual(1)

    storageService.setItem('test2', 'test')
    expect(storageService.entriesSnapshot().length).toEqual(2)

    storageService.setItem('test3', 'test')
    expect(storageService.entriesSnapshot().length).toEqual(3)
  })

  test('Should inserted keys', () => {
    const storageService = new RxStorage('inserted keys')

    for (let i = 0; i < 3; ++i) {
      const key = 'test' + i
      expect(storageService.hasItem(key)).toBeFalsy()

      storageService.setItem(key, 'value')
      expect(storageService.hasItem(key)).toBeTruthy()
    }
  })

  test('Should inserted items', () => {
    const storageService = new RxStorage('inserted items')

    for (let i = 0; i < 3; ++i) {
      const key = 'test' + i
      let value = 'value'

      expect(storageService.getItem(key)).not.toEqual(value)

      storageService.setItem(key, value)
      expect(storageService.getItem(key)).toEqual(value)

      value = 'value' + i
      storageService.setItem(key, value)
      expect(storageService.getItem(key)).toEqual(value)

      value = 'value' + i
      storageService.setItem(key, value)
      expect(storageService.getItem(key)).toEqual(value)
    }
  })

  test('Should cloned', () => {
    const storageService = new RxStorage('clone')

    storageService.setItem('test', 1)
    storageService.setItem('test', 2)

    const cloned = storageService.scope()

    expect(cloned !== storageService).toBeTruthy()
    expect(storageService.prefix === cloned.prefix).toBeTruthy()
    expect(storageService.length === cloned.length).toBeTruthy()

    cloned.setItem('test', 3)

    expect(storageService.length === cloned.length).toBeTruthy()
  })

  test('Should scope', () => {
    const storageService = new RxStorage('host')

    storageService.setItem('test', 1)
    storageService.setItem('test', 2)

    const scoped = storageService.scope('scope')

    expect(scoped !== storageService).toBeTruthy()
    expect(storageService.prefix === scoped.prefix).toBeFalsy()
    expect(storageService.length === scoped.length).toBeFalsy()

    scoped.setItem('test', 3)

    expect(storageService.length === scoped.length).toBeFalsy()
  })
})
}