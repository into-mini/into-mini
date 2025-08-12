import { resolve } from 'node:path';

import { AllInOnePlugin } from '@best-shot/sfc-split-plugin';

import { EmitEntriesPlugin } from 'emit-webpack-entries-plugin';

export default {
  mode: 'development',
  target: 'es2025',
  entry: {
    // a: './a.json',
    // b: './b.json',
    c: 'emit-webpack-entries-plugin/package.json',
  },
  context: resolve(process.cwd(), 'fake'),
  cache: false,
  output: {
    clean: true,
    chunkFormat: 'commonjs',
    chunkLoading: 'require',
    // module: true,
  },
  devtool: false,
  experiments: {
    layers: true,
    // outputModule: true,
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'initial',
      name: 'vendor',
    },
  },
  plugins: [
    new AllInOnePlugin({
      type: 'miniprogram',
    }),
    new EmitEntriesPlugin(),
  ],
};
