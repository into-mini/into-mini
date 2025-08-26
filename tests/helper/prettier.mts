import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import type { File, StringLiteral } from '@babel/types';
// @ts-expect-error ----------------
import { parsers as baseParsers } from 'prettier/plugins/babel.mjs';
import type { ParserOptions, Parser } from 'prettier';

function transformMultilineStringToTemplateLiteral(ast: File): File {
  // @ts-expect-error ----------------
  traverse.default(ast, {
    StringLiteral(path: NodePath<StringLiteral>) {
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
    parse(text: string, options: ParserOptions<File>, parser: Parser): File {
      const ast = baseParsers.babel.parse(text, options, parser);

      return transformMultilineStringToTemplateLiteral(ast);
    },
  },
};
