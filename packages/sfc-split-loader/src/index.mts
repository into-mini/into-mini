/* eslint-disable import/no-default-export */
import { basename } from 'node:path';
import { splitVueSFC } from './splitter.mts';
import type { LoaderContext } from 'webpack';
import { extractBlock } from './extract.mts';
import { decode } from 'qss';

type Query = {
  type: string;
  index: number;
};

// 常规loader函数
function loader(this: LoaderContext<null>, source: string) {
  const callback = this.async();

  try {
    const query = this.resourceQuery.replace(/^\?/, '');
    const parsedQuery = decode<Query>(query);

    if (parsedQuery.type) {
      // For block requests, extract the block
      const blockContent = extractBlock(source, {
        type: parsedQuery.type,
        index: parsedQuery.index,
      });
      callback(null, blockContent);
    } else {
      // For main SFC file, split into imports
      const filename = basename(this.resourcePath);
      const imports = splitVueSFC(source, filename);
      callback(null, imports);
    }
  } catch (error) {
    callback(error as Error);
  }
}

export default loader;
