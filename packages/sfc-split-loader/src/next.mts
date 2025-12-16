import type { LoaderContext } from 'webpack';

import { transformer } from '@into-mini/sfc-transformer/src/transformer.mts';
import type { Options } from '@into-mini/sfc-transformer/src/transformer.mts';

export default function loader(this: LoaderContext<Options>, source: string) {
  const { tagMatcher, preserveTap } = this.getOptions();

  try {
    const result = transformer(source, {
      tagMatcher,
      preserveTap,
    });

    this.callback(null, result);
  } catch (error) {
    this.callback(error as Error);
  }
}
