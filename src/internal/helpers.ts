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
  return resolvePrefix(prefix) + key;
}

export function removePrefix(prefix: string, key: string): string {
  return key.slice(resolvePrefix(prefix).length);
}

export function hasPrefix(prefix: string, key: string): boolean {
  return key?.startsWith(resolvePrefix(prefix)) ?? false;
}

function resolvePrefix(prefix?: string) {
  if(typeof prefix === 'string'){
    return prefix + '.'
  }

  return ''
}