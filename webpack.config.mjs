import { ExposeEntryNamePlugin } from '@best-shot/sfc-split-plugin/plugin/expose-entry.mjs';

export default {
  mode: 'development',
  entry: {
    abc: './src/a.xml',
    hig: './src/index.js',
    efg: './src/b.xml',
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
  optimization: {
    runtimeChunk: 'single',
  },
  plugins: [new ExposeEntryNamePlugin()],
};
