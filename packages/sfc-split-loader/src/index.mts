/* eslint-disable import/no-default-export */
import { basename } from 'node:path';
import { splitVueSFC } from './splitter.mts';
import type { LoaderContext } from 'webpack';
import { extractBlock } from './extract.mts';
import { decode } from 'qss';
import type { Options } from '@into-mini/sfc-transformer/src/transformer.mts';
import { transformer } from '@into-mini/sfc-transformer/dist/transformer.mjs';

type Query = {
  type: string;
  index: number;
};

export default function loader(this: LoaderContext<Options>, source: string) {
  const callback = this.async();
  const options = this.getOptions();

  try {
    const result = transformer(source, options);

    const { type, index } = decode<Query>(
      this.resourceQuery.replace(/^\?/, ''),
    );

    if (type) {
      const blockContent = extractBlock(result, {
        type,
        index,
      });

      callback(null, blockContent);
    } else {
      const { resourcePath } = this;
      const filename = basename(resourcePath);

      const imports = splitVueSFC(result, filename);

      callback(null, imports);
    }
  } catch (error) {
    callback(error as Error);
  }
}
