/* eslint-disable import/no-default-export */
import { basename } from 'node:path';
import { splitVueSFC } from './splitter.mts';
import type { LoaderContext } from 'webpack';
import { extractBlock } from './extract.mts';
import { decode } from 'qss';
import { transformer } from '@into-mini/sfc-transformer/dist/transformer.mjs';
import type { Options } from '@into-mini/sfc-transformer/src/transformer.mts';

type Query = {
  type: string;
  index: number;
};

// 常规loader函数
function loader(this: LoaderContext<Options>, source: string) {
  if (typeof this.cacheable === 'function') {
    this.cacheable();
  }

  const callback = this.async();

  const options = this.getOptions() || {};

  try {
    const query = this.resourceQuery.replace(/^\?/, '');
    const parsedQuery = decode<Query>(query);

    const result = transformer(source, options);

    if (parsedQuery.type) {
      // For block requests, extract the block
      const blockContent = extractBlock(result, {
        type: parsedQuery.type,
        index: parsedQuery.index,
      });
      callback(null, blockContent);
    } else {
      // For main SFC file, split into imports
      const filename = basename(this.resourcePath);
      const imports = splitVueSFC(result, filename);
      callback(null, imports);
    }
  } catch (error) {
    callback(error as Error);
  }
}

export default loader;
