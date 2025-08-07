import { createPinia as createPiniaRaw } from '@vue-mini/pinia';

export { defineStore, disposePinia, storeToRefs } from '@vue-mini/pinia';

export function createPinia() {
  createPiniaRaw();

  return { install() {} };
}
