import { resolve } from 'node:path';

import { AllInOnePlugin } from '@best-shot/sfc-split-plugin';

export default {
  mode: 'development',
  // entry: {
  //   // a: './a.json',
  //   // b: './b.json',
  // },
  context: resolve(process.cwd(), 'src'),
  output: {
    clean: true,
  },
  experiments: { layers: true },
  plugins: [
    new AllInOnePlugin({
      type: 'miniprogram',
    }),
  ],
};
