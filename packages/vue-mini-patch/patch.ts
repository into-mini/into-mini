export {
  onReady as onActivated,
  onReady as onBeforeMount,
  onDetach as onBeforeUnmount,
  onShow as onBeforeUpdate,
  onDetach as onDeactivated,
  onReady as onMounted,
  onDetach as onUnmounted,
  onShow as onUpdated,
} from '@vue-mini/core';

export const TransitionGroup = () => {
  throw new Error('TransitionGroup is not supported in mini program');
};

export const h = () => {
  throw new Error('h is not supported in mini program');
};

export const Fragment = () => {
  throw new Error('Fragment is not supported in mini program');
};

export const isVNode = () => false;

export const hasInjectionContext = () => true;
