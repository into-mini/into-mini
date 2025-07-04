import { ExposeEntryNamePlugin } from '@best-shot/sfc-split-plugin/plugin/expose-entry.mjs';
import { PatchLoaderPlugin } from '@best-shot/sfc-split-plugin/todo/test-plugin.mjs';

export default {
  mode: 'development',
  entry: {
    abc: './src/a.xml',
    hig: './src/index.js',
    // efg: './src/b.xml',
  },
  output: {
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(wxml|xml)$/,
        type: 'asset/resource',
        generator: {
          filename: '[entry][ext]',
        },
      },
    ],
  },
  plugins: [
    new ExposeEntryNamePlugin(),
    new PatchLoaderPlugin({
      efg: (io) => {
        console.log({ io });

        return io;
      },
    }),
  ],
};
