import { mergeOptions } from './helper.ts';
import type { MixComponentOptions } from './type.d.ts';

export function $$asComponent(options: MixComponentOptions) {
  const io = mergeOptions(options);
  /* global Component: readonly */
  Component(io);
}
