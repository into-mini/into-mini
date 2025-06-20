import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { parsers as baseParsers } from 'prettier/plugins/babel.mjs';

function transformMultilineStringToTemplateLiteral(ast) {
  traverse.default(ast, {
    StringLiteral(path) {
      const { node } = path;

      if (node.value.includes('\n')) {
        const templateElement = t.templateElement(
          {
            raw: node.value,
            cooked: node.value,
          },
          true,
        );
        const templateLiteral = t.templateLiteral([templateElement], []);
        path.replaceWith(templateLiteral);
      }
    },
  });

  return ast;
}

export const parsers = {
  babel: {
    ...baseParsers.babel,
    parse(text, parser, options) {
      const ast = baseParsers.babel.parse(text, parser, options);

      return transformMultilineStringToTemplateLiteral(ast);
    },
  },
};
