import { FilterType } from "./interfaces";

export function wrap(
  originalFn: Function,
  fn: (originalFn: Function, ...args: any[]) => any,
) {
  return function (this: any, ...args: any[]) {
    return fn.call(this as any, originalFn, ...args);
  };
}

export function handleFilter(prefix: string, filter?: FilterType): FilterType {
  return (key) => {
    if (!hasPrefix(prefix, key)) {
      return false;
    }

    if (!filter) {
      return true;
    }

    return filter(key);
  };
}

export function handleKeyOrKeys(prefix: string, keyOrKeys?: string | string[]) {
  if (Array.isArray(keyOrKeys)) {
    keyOrKeys = keyOrKeys.map((key) => insertPrefix(prefix, key));
  } else if (typeof keyOrKeys === "string") {
    keyOrKeys = insertPrefix(prefix, keyOrKeys);
  }

  return keyOrKeys;
}

export function insertPrefix(prefix: string, key: string): string {
  return (prefix ?? "") + "." + key;
}

export function removePrefix(prefix: string, key: string): string {
  return key.slice(((prefix ?? "") + ".").length);
}

export function hasPrefix(prefix: string, key: string): boolean {
  return key?.startsWith((prefix ?? "") + ".") ?? false;
}
