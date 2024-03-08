import { RxAbstractStorage } from "./abstract-storage.service";

export class RxSessionStorage extends RxAbstractStorage {
  constructor(prefix?: string) {
    super(sessionStorage, prefix);
  }
}
