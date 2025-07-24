import { resolve } from 'node:path';

import { AllInOnePlugin } from '@best-shot/sfc-split-plugin';

export default {
  mode: 'development',
  target: 'web',
  entry: {
    // a: './a.json',
    // b: './b.json',
    // c: './c.js',
  },
  context: resolve(process.cwd(), 'fake'),
  cache: false,
  output: {
    clean: true,
    // module: true,
  },
  devtool: false,
  experiments: {
    layers: true,
    // outputModule: true,
  },
  optimization: {
    runtimeChunk: 'single',
  },
  plugins: [
    new AllInOnePlugin({
      type: 'miniprogram',
    }),
  ],
};
