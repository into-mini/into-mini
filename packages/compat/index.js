import './style.css';

Object.assign(globalThis, {
  wx: {
    getDeviceInfo() {
      return {
        system: window.navigator.userAgent || 'mobile',
      };
    },
    getAccountInfoSync() {
      return {
        miniProgram: {
          envVersion: import.meta.env.DEV ? 'develop' : 'release',
        },
      };
    },
    openDocument({ filePath }) {
      // @ts-expect-error
      window.open(filePath);
    },
    downloadFile({ url }) {
      return fetch(url).then((resp) =>
        resp.blob().then((blob) => ({
          tempFilePath: URL.createObjectURL(blob),
        })),
      );
    },
  },
  Behavior({ mixins = [], behaviors = [], ...io }) {
    return {
      ...io,
      mixins: behaviors.length > 0 ? [...mixins, ...behaviors] : mixins,
    };
  },
});
