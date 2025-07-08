import { resolve } from 'node:path';

import { AllInOnePlugin } from '@best-shot/sfc-split-plugin';

export default {
  mode: 'development',
  // entry: {
  //   // a: './a.json',
  //   // b: './b.json',
  // },
  context: resolve(process.cwd(), 'src'),
  cache: false,
  output: {
    clean: true,
  },
  devtool: false,
  experiments: { layers: true },
  plugins: [
    new AllInOnePlugin({
      type: 'miniprogram',
    }),
  ],
};
