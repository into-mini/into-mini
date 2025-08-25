import { defineComponent } from '@vue-mini/core';

import { hackOptions } from './hack.ts';
import { mergeOptions } from './helper.ts';
import type { MixComponentOptions } from './type.d.ts';

export function $$asComponent(options: MixComponentOptions) {
  const io =
    options.options &&
    'hacked' in options.options &&
    options.options.hacked === true
      ? hackOptions(mergeOptions(options))
      : mergeOptions(options);

  if (io.setup) {
    defineComponent(io);
  } else {
    /* global Component: readonly */
    Component(io);
  }
}
