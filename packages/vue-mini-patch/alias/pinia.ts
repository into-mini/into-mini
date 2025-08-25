import { createPinia as createPiniaRaw } from '@vue-mini/pinia';

export { defineStore, disposePinia, storeToRefs } from '@vue-mini/pinia';

export function createPinia() {
  const io = createPiniaRaw();

  Object.defineProperty(io, 'install', {
    value() {},
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return io;
}
