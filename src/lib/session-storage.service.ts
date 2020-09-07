import { AbstractStorageService } from './abstract-storage.service';

export class SessionStorageService extends AbstractStorageService {
  constructor(prefix?: string) {
    super(sessionStorage, prefix);
  }
}
