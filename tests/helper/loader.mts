import { runLoaders } from 'loader-runner';

/**
 * 运行loader
 * @param {string} resourcePath 资源路径
 * @param {string} source 资源内容
 * @param {Object} options loader选项
 * @returns {Promise<Object>} loader运行结果
 */
export async function runLoader(resourcePath: string, source: string) {
  return new Promise((resolve, reject) => {
    runLoaders(
      {
        context: {},
        resource: resourcePath,
        loaders: [
          {
            loader: '@into-mini/sfc-split-loader',
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
          resolve(result);
        }
      },
    );
  });
}

/**
 * 运行loader并获取输出
 * @param {string} resourcePath 资源路径
 * @param {string} source 资源内容
 * @param {Object} options loader选项
 * @returns {Promise<string>} loader输出
 */
export async function runLoaderAndGetOutput(
  resourcePath: string,
  source: string,
) {
  const result = await runLoader(resourcePath, source);

  return (result as any).result.join('');
}
