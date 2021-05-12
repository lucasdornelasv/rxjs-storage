import { RxAbstractStorage } from './abstract-storage.service';

export class RxLocalStorage extends RxAbstractStorage {
  constructor(prefix?: string) {
    super(localStorage, prefix);
  }
}
