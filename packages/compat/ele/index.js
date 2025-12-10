import { defineAsyncComponent } from 'vue';

export const autoRegister = {
  install(app) {
    app
      .component(
        'icon',
        defineAsyncComponent(() => import('./icon.vue')),
      )
      .component(
        'scroll-view',
        defineAsyncComponent(() => import('./scroll-view.vue')),
      );
  },
};
