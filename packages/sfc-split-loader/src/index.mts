/* eslint-disable import/no-default-export */
import { basename } from 'node:path';
import { processVueSFC, extractBlock } from './splitter.mts';
import type { LoaderContext } from 'webpack';

export default function loader(this: LoaderContext<null>, source: string) {
  const callback = this.async();

  try {
    const type = this.resourceQuery.match(/type=([^&]+)/)?.[1];

    if (type) {
      const lang = this.resourceQuery.match(/lang=([^&]+)/)?.[1];
      const index = this.resourceQuery.match(/index=([^&]+)/)?.[1];
      const blockContent = extractBlock(source, {
        type,
        lang: lang || 'txt',
        index: Number(index),
      });
      callback(null, blockContent);
    } else {
      const { resourcePath } = this;
      callback(null, processVueSFC(source, basename(resourcePath)));
    }
  } catch (error) {
    callback(error as Error);
  }
}
