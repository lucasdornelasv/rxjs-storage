import { AbstractStorageService } from './abstract-storage.service';

export class LocalStorageService extends AbstractStorageService {
  constructor(prefix?: string) {
    super(localStorage, prefix);
  }
}
