import { parse } from '@vue/compiler-sfc';

interface ExtractOptions {
  type: string;
  lang: string;
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
    default: {
      // 自定义块
      const customIndex = options.index || 0;
      const customBlock = descriptor.customBlocks.find(
        (block, index) => block.type === options.type && index === customIndex,
      );

      if (customBlock) {
        return customBlock.content;
      }
      break;
    }
  }
  return '';
}

export function processVueSFC(source: string, filename: string) {
  if (source.trim() === '') {
    return '';
  }

  const { descriptor, errors } = parse(source.trim());

  if (errors && errors.length > 0) {
    throw new Error(
      `Vue SFC parse errors:\n${errors
        .map((err) => err.toString())
        .join('\n')}`,
    );
  }

  const imports = [];

  // 1. 模板导入
  if (descriptor.template) {
    const lang = descriptor.template.lang || 'html';
    imports.push(`import './${filename}?type=template&lang=${lang}';`);
  }

  // 2. 样式导入
  descriptor.styles.forEach((style, index) => {
    const lang = style.lang || 'css';
    imports.push(
      `import './${filename}?type=style&lang=${lang}&index=${index}';`,
    );
  });

  // 3. 自定义块导入
  descriptor.customBlocks.forEach((block, index) => {
    const lang = block.lang || 'txt';
    imports.push(
      `import './${filename}?type=${block.type}&lang=${lang}&index=${index}';`,
    );
  });

  // 4. 脚本导入
  const lang = descriptor.script?.lang || 'js';
  imports.push(`import './${filename}?type=script&lang=${lang}';`);

  // 返回脚本内容
  return imports.join('\n');
}
