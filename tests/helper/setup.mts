import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

// 模拟微信小程序的 WXS 特性
const preload = `
function getRegExp(pattern, flags) {
  return new RegExp(pattern, flags);
}
`;

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.wxs')) {
      const source = readFileSync(new URL(url), 'utf8');

      return {
        format: 'commonjs',
        source: preload + source.replaceAll("'Array'", 'Array'),
        shortCircuit: true,
      };
    }

    return nextLoad(url, context);
  },
});
