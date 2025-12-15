import type { LoaderContext } from 'webpack';

import { transformer } from './transformer.mts';
import type { Options } from './transformer.mts';

export default function loader(this: LoaderContext<Options>, source: string) {
  const { tagMatcher, preserveTap } = this.getOptions();

  return transformer(source, {
    tagMatcher,
    preserveTap,
  });
}
