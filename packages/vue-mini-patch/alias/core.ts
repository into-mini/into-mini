import {
  createApp as createAppRaw,
  defineComponent as defineComponentRaw,
  provide,
} from '@vue-mini/core';
import type { App } from 'vue';

// eslint-disable-next-line import/export
export * from '@vue-mini/core';

export { onDetach as onMounted } from '@vue-mini/core';

// eslint-disable-next-line import/export
export function defineComponent(
  options: Parameters<typeof defineComponentRaw>[0],
  config?: Parameters<typeof defineComponentRaw>[1],
) {
  const { setup } = options;

  return defineComponentRaw(
    {
      ...options,
      setup: setup
        ? function _(props, context) {
            return setup(props, {
              ...context,
              // expose: () => {},
              get parent() {
                return context.selectOwnerComponent();
              },
              // @ts-expect-error -----------------
              emit: (event: string, detail?: unknown) => {
                context.triggerEvent(event, detail);
              },
            });
          }
        : undefined,
    },
    config,
  );
}

export type hackedApp = {
  mount(): void;
  unmount(): void;
  provide(
    key: Parameters<App['provide']>[0],
    value: Parameters<App['provide']>[1],
  ): hackedApp;
  use(
    plugin: Parameters<App['use']>[0],
    pluginOptions?: Parameters<App['use']>[1],
  ): hackedApp;
  globalData: unknown;
};

// eslint-disable-next-line import/export
export function createApp(
  options: Parameters<typeof createAppRaw>[0],
): hackedApp {
  // eslint-disable-next-line no-param-reassign
  options.globalData ??= {};

  createAppRaw(options);

  const io: hackedApp = Object.seal({
    get globalData() {
      return getApp().globalData;
    },
    mount() {},
    unmount() {},
    provide(
      key: Parameters<App['provide']>[0],
      value: Parameters<App['provide']>[1],
    ) {
      provide(key, value);

      return io;
    },
    use(
      plugin: Parameters<App['use']>[0],
      pluginOptions?: Parameters<App['use']>[1],
    ) {
      if (plugin.install) {
        // @ts-expect-error -----------------
        plugin.install(io, pluginOptions);
      }

      return io;
    },
  });

  return io;
}

export const hasInjectionContext = () => true;
