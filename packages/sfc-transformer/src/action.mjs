/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
import {
  ElementTypes,
  NodeTypes,
  traverse,
} from '@into-mini/sfc-template-traverse';
import { serializeTemplate } from '@padcom/vue-ast-serializer';
import { kebabCase } from 'change-case';

import { CLSX_PLACEHOLDER } from './utils.mts';

const actions = {
  click: 'tap',
};

const native = ['input', 'textarea', 'button', 'view', 'text'];

function canBeString(exp) {
  if (!exp.ast) {
    return false;
  }

  return (
    (exp.ast.type === 'BinaryExpression' && exp.ast.operator) ||
    (exp.ast.type === 'ConditionalExpression' &&
      exp.ast.consequent.type === 'StringLiteral' &&
      exp.ast.alternate.type === 'StringLiteral')
  );
}

export function transformTemplateAst(ast, { tagMatcher, preserveTap } = {}) {
  const tags = new Map();

  traverse(ast, {
    // ROOT: (node) => console.log('ROOT:', node),
    TEXT(node) {
      node.content = node.content.trim();
    },
    ATTRIBUTE: (node) => {
      if (/[A-Z]/.test(node.name)) {
        return {
          ...node,
          name: node.name
            .split(/:/)
            .map((path) => kebabCase(path))
            .join(':'),
        };
      }
    },
    SIMPLE_EXPRESSION(node, ctx) {
      if (
        node.constType === 0 &&
        ctx.parent.node.type !== NodeTypes.INTERPOLATION &&
        !(
          ctx.parent.node.type === NodeTypes.DIRECTIVE &&
          ctx.parent.node.name === 'text'
        )
      ) {
        return {
          type: NodeTypes.INTERPOLATION,
          content: node,
        };
      }

      return {
        ...node,
        content: node.content
          .trim()
          .split('\n')
          .map((fragment) => fragment.trim())
          .join(''),
      };
    },
    DIRECTIVE_BIND(node, ctx) {
      if (node.arg?.content) {
        if (node.arg.content === 'key') {
          const upper = ctx.parent.node.flat();

          const io =
            upper.find(
              (item) =>
                item.type === NodeTypes.ATTRIBUTE &&
                item.name === 'wx:for-item',
            )?.value?.content ||
            upper.find(
              (item) =>
                item.type === NodeTypes.DIRECTIVE &&
                item.name === 'for' &&
                item.forParseResult?.value,
            )?.forParseResult?.value?.content;

          return {
            type: NodeTypes.ATTRIBUTE,
            name: 'wx:key',
            value: {
              ...node.exp,
              constType: 3,
              content: io
                ? node.exp.content.replace(new RegExp(`^${io}.`), '')
                : node.exp.content,
            },
          };
        }

        if (node.arg.content === 'class' && !node.clsx) {
          const findRaw = (prop) =>
            prop.type === NodeTypes.ATTRIBUTE &&
            prop.name === 'class' &&
            prop.value?.content &&
            !prop.clsx;

          const raw = ctx.parent.node.find((element) => findRaw(element));

          ctx.parent.node[
            ctx.parent.node.findIndex((element) => findRaw(element))
          ] = {
            type: NodeTypes.TEXT,
            content: '',
          };

          if (!raw?.value?.content && node.exp.ast.type === 'StringLiteral') {
            return {
              type: NodeTypes.ATTRIBUTE,
              name: node.arg.content,
              value: {
                type: NodeTypes.TEXT,
                content: node.exp.ast.value,
              },
            };
          }

          const result = raw?.value?.content
            ? `clsx.clsx('${raw.value.content.trim()}', ${node.exp.content?.trim()})`
            : canBeString(node.exp)
              ? node.exp.content.trim()
              : `clsx.clsx(${node.exp.content.trim()})`;

          if (result.includes('clsx.clsx(')) {
            ast.cached ??= {};
            ast.cached.clsx ||= true;
          }

          const target = {
            type: NodeTypes.ATTRIBUTE,
            name: node.arg.content,
            clsx: true,
            value: {
              type: NodeTypes.INTERPOLATION,
              content: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                isStatic: false,
                constType: 0,
                content: result,
              },
            },
          };

          return target;
        }

        if (node.arg.content.startsWith('generic:') && node.exp.content) {
          return {
            type: NodeTypes.ATTRIBUTE,
            name: node.arg.content,
            value: {
              ...node.exp,
              constType: 3,
              content: kebabCase(node.exp.content),
            },
          };
        }

        return {
          type: NodeTypes.ATTRIBUTE,
          name: node.arg.content,
          value: node.exp ?? node.arg,
        };
      }
    },
    DIRECTIVE_MODEL(node, ctx) {
      return {
        type: NodeTypes.ATTRIBUTE,
        name: [
          node.name,
          node.arg?.content ||
            (native.includes(ctx.parent.parent.node.tag)
              ? 'value'
              : 'modelValue'),
        ].join(':'),
        value: {
          type: NodeTypes.INTERPOLATION,
          content: node.exp,
        },
      };
    },
    DIRECTIVE_FOR(node, ctx) {
      if (node.forParseResult) {
        const { source, value, key } = node.forParseResult;

        ctx.parent.after(() => {
          ctx.parent.update(ctx.parent.node.flat());
        });

        return [
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'wx:for',
            value: source,
          },
          {
            type: NodeTypes.ATTRIBUTE,
            name: 'wx:for-item',
            value: {
              ...value,
              constType: 3,
            },
          },
          key?.content
            ? {
                type: NodeTypes.ATTRIBUTE,
                name: 'wx:for-index',
                value: {
                  ...key,
                  constType: 3,
                },
              }
            : undefined,
        ].filter(Boolean);
      }

      return {
        type: NodeTypes.ATTRIBUTE,
        name: 'wx:for',
        value: node.exp ?? node.arg,
      };
    },
    DIRECTIVE_TEXT(node, ctx) {
      ctx.parent.parent.node.isSelfClosing = false;
      ctx.parent.parent.node.children = [
        node.exp.ast?.type === 'StringLiteral'
          ? {
              type: NodeTypes.TEXT,
              content: node.exp.ast.value,
            }
          : {
              type: NodeTypes.INTERPOLATION,
              content: node.exp,
            },
      ];

      ctx.remove();
    },
    DIRECTIVE_SLOT(node) {
      if (node.arg?.content) {
        return {
          type: NodeTypes.ATTRIBUTE,
          name: node.name,
          value: node.arg,
        };
      }
    },
    DIRECTIVE_ON(node, ctx) {
      if (node.arg?.content && node.exp?.content) {
        return {
          type: NodeTypes.ATTRIBUTE,
          name: `bind:${
            native.includes(ctx.parent.parent.node.tag) ||
            (preserveTap ? preserveTap(ctx.parent.parent.node.tag) : false)
              ? actions[node.arg.content] || node.arg.content
              : node.arg.content
          }`,
          value: {
            ...node.exp,
            constType: 3,
          },
        };
      }
    },
    DIRECTIVE_IF(node) {
      if (node.exp?.content) {
        return {
          type: NodeTypes.ATTRIBUTE,
          name: 'wx:if',
          value: node.exp,
        };
      }
    },
    DIRECTIVE_ELSE_IF(node) {
      if (node.exp?.content) {
        return {
          type: NodeTypes.ATTRIBUTE,
          name: 'wx:elif',
          value: node.exp,
        };
      }
    },
    DIRECTIVE_ELSE() {
      return {
        type: NodeTypes.ATTRIBUTE,
        name: 'wx:else',
      };
    },
    ELEMENT(node) {
      if (tagMatcher) {
        const { tag, path } = tagMatcher(node.tag) || {};

        if (tag && tag.trim() && path && path.trim()) {
          tags.set(kebabCase(tag.trim()), path.trim());
        }
      }
      switch (node.tag) {
        case 'template': {
          if (
            node.children.length === 1 &&
            node.props.some(
              (item) =>
                (item.type === NodeTypes.ATTRIBUTE ||
                  item.type === NodeTypes.DIRECTIVE) &&
                item.name === 'slot',
            )
          ) {
            const child = structuredClone(node.children[0]);

            child.props ||= [];

            child.props.push(...node.props);

            return child;
          }

          node.tag = 'block';
          break;
        }
        case 'img': {
          node.tag = 'image';
          break;
        }
        case 'span': {
          node.tag = 'text';
          break;
        }
        case 'div':
        case 'p': {
          node.tag = 'view';
          break;
        }
        case 'br': {
          node.tag = 'view';
          node.props = [
            {
              type: NodeTypes.ATTRIBUTE,
              name: 'style',
              value: { type: NodeTypes.TEXT, content: 'height:1em' },
            },
          ];
          node.isSelfClosing = false;
          break;
        }
        case 'hr': {
          node.tag = 'view';
          node.props = [
            {
              type: NodeTypes.ATTRIBUTE,
              name: 'class',
              value: { type: NodeTypes.TEXT, content: 'hr' },
            },
          ];
          node.isSelfClosing = false;
          break;
        }
        default: {
          if (node.tagType === 1) {
            node.tag = kebabCase(node.tag);
          }
        }
      }
    },
  });

  if (ast.cached?.clsx && !ast.children.some((item) => item.clsx)) {
    ast.children.unshift({
      clsx: true,
      type: NodeTypes.ELEMENT,
      tag: 'wxs',
      ns: 0,
      tagType: ElementTypes.ELEMENT,
      props: [
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'src',
          value: { type: NodeTypes.TEXT, content: CLSX_PLACEHOLDER },
        },
        {
          type: NodeTypes.ATTRIBUTE,
          name: 'module',
          value: { type: NodeTypes.TEXT, content: 'clsx' },
        },
      ],
      isSelfClosing: true,
      children: [],
    });
  }

  return {
    tags, // TODO
    ast,
  };
}

export function action(template) {
  const tpl = template.ast.children
    .map((item) => serializeTemplate({ ast: item }))
    .join('\n');

  return { ast: template.ast, tpl };
}
