

import tabToSpace from 'tab-to-space';
import { generate, parse } from 'wxml-parse';

export const pretty = function pretty(source) {
  const ast = parse(source);
  const io = generate(ast, {
    maxWidth: 80,
    // compress: true,
  });

  return tabToSpace(io, 2);
};
