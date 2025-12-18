/* eslint-disable import/no-default-export */
import { basename } from 'node:path';
import { processVueSFC } from './splitter.mts';
import type { LoaderContext } from 'webpack';
import { extractBlock } from './extract.mts';
import { decode } from 'qss';

type Query = {
  type: string;
  index: number;
};

export default function loader(this: LoaderContext<null>, source: string) {
  const callback = this.async();

  try {
    const { type, index } = decode<Query>(
      this.resourceQuery.replace(/^\?/, ''),
    );

    if (type) {
      const blockContent = extractBlock(source, {
        type,
        index,
      });

      callback(null, blockContent);
    } else {
      const { resourcePath } = this;
      const filename = basename(resourcePath);

      const imports = processVueSFC(source, filename);

      callback(null, imports);
    }
  } catch (error) {
    callback(error as Error);
  }
}
