import { useSyncExternalStore } from "react";

export function createResource<T>(initial: T, load: () => Promise<T>) {
  let value = initial;
  let started = false;
  const listeners = new Set<() => void>();

  function get() {
    return value;
  }

  function set(next: T) {
    value = next;
    listeners.forEach((listener) => listener());
  }

  function update(fn: (current: T) => T) {
    set(fn(value));
  }

  async function reload() {
    try {
      set(await load());
    } catch (err) {
      console.error(err);
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!started) {
      started = true;
      void reload();
    }
    return () => {
      listeners.delete(listener);
    };
  }

  function use() {
    return useSyncExternalStore(subscribe, get);
  }

  return { get, set, update, reload, use };
}
