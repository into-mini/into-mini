import { createApp as createAppRaw, provide } from '@vue-mini/core';

// eslint-disable-next-line import/export
export * from '@vue-mini/core';

// eslint-disable-next-line import/export
export function createApp(options) {
  // eslint-disable-next-line no-param-reassign
  options.globalData ??= {};

  createAppRaw(options);

  const io = Object.seal({
    provide(key, value) {
      provide(key, value);

      return io;
    },
    use(plugin, pluginOptions) {
      if (plugin.install) {
        plugin.install(io, pluginOptions);
      }

      return io;
    },
    mount() {},
    unmount() {},
    get globalData() {
      return getApp().globalData;
    },
  });

  return io;
}

export const hasInjectionContext = () => true;
