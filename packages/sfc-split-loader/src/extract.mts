import { parse } from '@vue/compiler-sfc';

interface ExtractOptions {
  type: string;
  index?: number;
}

export function extractBlock(source: string, options: ExtractOptions): string {
  // 解析 Vue SFC
  const { descriptor, errors } = parse(source);

  if (errors && errors.length > 0) {
    throw new Error(
      `Vue SFC parse errors:\n${errors
        .map((err) => err.toString())
        .join('\n')}`,
    );
  }
  switch (options.type) {
    case 'template': {
      if (descriptor.template) {
        return descriptor.template.content;
      }
      break;
    }
    case 'style': {
      const styleIndex = options.index || 0;

      if (descriptor.styles[styleIndex]) {
        return descriptor.styles[styleIndex].content;
      }
      break;
    }
    case 'script': {
      if (descriptor.script) {
        return descriptor.script.content;
      }

      if (descriptor.scriptSetup) {
        return descriptor.scriptSetup.content;
      }
      break;
    }
    case 'config': {
      const blockIndex = options.index || 0;

      if (
        descriptor.customBlocks[blockIndex] &&
        descriptor.customBlocks[blockIndex].type === 'config'
      ) {
        return descriptor.customBlocks[blockIndex].content;
      }
      break;
    }
    default: {
      return '';
    }
  }
  return '';
}
