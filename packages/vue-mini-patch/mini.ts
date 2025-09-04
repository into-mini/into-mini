import { defineComponent, definePage } from './alias/core.ts';
import { mergeComponentOptions, mergePageOptions } from './helper.ts';
import type { MixComponentOptions, MixPageOptions } from './type.d.ts';

export function $$asComponent(options: MixComponentOptions | MixPageOptions) {
  const isPage =
    'options' in options && options.options && 'isPage' in options.options
      ? options.options.isPage === true
      : false;

  if (isPage) {
    const io = mergePageOptions(options as MixPageOptions);

    if (io.setup) {
      definePage(io);
    } else {
      /* global Page: readonly */
      Page(io);
    }
  } else {
    const io = mergeComponentOptions(options as MixComponentOptions);

    if (io.setup) {
      defineComponent(io);
    } else {
      /* global Component: readonly */
      Component(io);
    }
  }
}
