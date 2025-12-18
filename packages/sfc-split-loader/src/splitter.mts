import { parse } from '@vue/compiler-sfc';

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
    const lang = block.lang || 'json';
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
