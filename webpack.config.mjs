import { PatchLoaderPlugin } from '@best-shot/sfc-split-plugin/todo/wip-plugin.mjs';

export default {
  mode: 'development',
  entry: {
    abc: './src/a.json',
  },
  output: {
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'asset/resource',
        use: [
          {
            loader: './src/abc-loader.mjs',
          },
        ],
      },
    ],
  },
  plugins: [
    new PatchLoaderPlugin({
      abc: (loaders) => {
        console.log(loaders);

        // 返回空数组，删除所有 loaders
        return [];
      },
    }),
  ],
};
