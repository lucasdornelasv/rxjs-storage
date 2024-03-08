import { Observable } from 'rxjs'

export interface IEntry {
  readonly key: string
  readonly item: any
  readonly exists: boolean
  remove(): void
}

export interface IEntrySnapshot {
  readonly key: string
  readonly item: any
  readonly exists: boolean
}

export interface IEntryChange {
  key: string
  oldItem: any
  newItem: any
}

export type FilterType = (key: string) => boolean

export interface IRxStorage {
  readonly prefix: string

  onItemChanged(keyOrKeys?: string | string[]): Observable<IEntryChange>
  onItemRemoved(keyOrKeys?: string | string[]): Observable<IEntrySnapshot>
  hasItem(key: string): boolean
  getItem<T = any>(key: string): T
  key<T = any>(index: number): T
  setItem(key: string, item: any)
  keys(filter?: FilterType): string[]
  keysIterator(filter?: FilterType): IterableIterator<string>
  items(filter?: FilterType): any[]
  itemsIterator(filter?: FilterType): IterableIterator<any>
  entries(filter?: FilterType): IEntry[]
  entriesIterator(filter?: FilterType): IterableIterator<IEntry>
  entriesSnapshot(filter?: FilterType): IEntrySnapshot[]
  entriesSnapshotIterator(filter?: FilterType): IterableIterator<IEntrySnapshot>
  entry(key: string): IEntry
  entrySnapshot(key: string): IEntrySnapshot
  removeItem(key: string)
  clear(filter?: FilterType)
  scope(prefix?: string): IRxStorage
  dispose()
  [Symbol.dispose]()
}
