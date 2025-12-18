// eslint-disable-next-line import/no-extraneous-dependencies
import { runLoaders } from 'loader-runner';

export async function runLoader(
  resourcePath: string,
  source: string,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    runLoaders(
      {
        context: {},
        resource: resourcePath,
        loaders: [
          {
            loader: '@into-mini/sfc-split-loader/src/index.mts',
          },
        ],
        readResource: (
          _resourcePath: string,
          callback: (
            err: NodeJS.ErrnoException | null,
            data: Buffer | null,
          ) => void,
        ) => {
          callback(null, Buffer.from(source));
        },
      },
      (err: null | Error, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.result);
        }
      },
    );
  });
}
