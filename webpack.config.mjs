import { resolve } from 'node:path';

import { SfcSplitPlugin } from '@into-mini/sfc-split-plugin/src/index.mts';
import { AutoEntriesPlugin } from '@into-mini/auto-entries-plugin';
import { EmitEntriesPlugin } from 'emit-webpack-entries-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export default {
  mode: 'development',
  target: 'es2025',
  entry: {
    // 'pages/index': './pages/index.vue',
    // 'pages/index2': './pages/index2.vue',
    // a: './a.json',
    // b: './b.json',
    // c: 'emit-webpack-entries-plugin/package.json',
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
    // layers: true,
    // outputModule: true,
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'initial',
      name: 'vendor',
    },
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        type: 'javascript/auto',
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-typescript'],
        },
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=script/,
        type: 'javascript/esm',
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=template/,
        type: 'asset/resource',
        generator: {
          filename: '[entry].wxml',
        },
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=style/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=config/,
        type: 'asset/resource',
        generator: {
          filename: '[entry].json',
        },
        use: [
          {
            loader: '@into-mini/sfc-split-plugin/src/loader/entry-loader.mts',
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: '@into-mini/sfc-split-loader/src/index.mts',
      },
    ],
  },
  plugins: [
    new SfcSplitPlugin({
      type: 'miniprogram',
    }),
    new AutoEntriesPlugin({
      type: 'miniprogram',
    }),
    new EmitEntriesPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].wxss',
    }),
  ],
};
