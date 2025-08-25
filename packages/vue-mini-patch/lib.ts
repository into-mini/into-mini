/* eslint-disable no-param-reassign */
import type { ComponentPropsOptions } from 'vue';

type PropsType =
  | BooleanConstructor
  | NumberConstructor
  | StringConstructor
  | ObjectConstructor
  | ArrayConstructor
  | null;

export function mergeProperties(
  props?: ComponentPropsOptions,
  properties?: WechatMiniprogram.Component.PropertyOption,
): WechatMiniprogram.Component.PropertyOption | undefined {
  const io =
    typeof props === 'object'
      ? Array.isArray(props)
        ? Object.fromEntries(
            props
              .filter((key) => typeof key === 'string')
              .map((key) => [key, {}]),
          )
        : Object.fromEntries(
            Object.entries(props).map(([key, prop]) => {
              if (prop === null) {
                return [key, {}];
              }

              if (Array.isArray(prop)) {
                if (prop.length === 0) {
                  return [key, {}];
                }

                const temp: WechatMiniprogram.Component.AllFullProperty =
                  prop.length === 1
                    ? { type: prop[0] as PropsType }
                    : {
                        type: prop[0] as PropsType,
                        optionalTypes: prop.slice(1) as PropsType[],
                      };

                return [key, temp];
              }

              if (typeof prop === 'object') {
                if ('type' in prop && Array.isArray(prop.type)) {
                  if (prop.type.length === 0) {
                    delete prop.type;
                  } else if (prop.type.length === 1) {
                    // eslint-disable-next-line prefer-destructuring
                    prop.type = prop.type[0];
                  } else {
                    const splited = prop.type.slice(1);

                    if (
                      'optionalTypes' in prop &&
                      Array.isArray(prop.optionalTypes)
                    ) {
                      prop.optionalTypes.push(...splited);
                    } else {
                      Object.assign(prop, {
                        optionalTypes: splited,
                      });
                    }

                    // eslint-disable-next-line prefer-destructuring
                    prop.type = prop.type[0];
                  }
                }

                if ('default' in prop) {
                  if (!('value' in prop)) {
                    Object.assign(prop, {
                      value:
                        typeof prop.default === 'function'
                          ? prop.default()
                          : prop.default,
                    });
                  }

                  delete prop.default;
                }

                if ('required' in prop) {
                  delete prop.required;

                  Object.assign(prop, {
                    observer(newVal: unknown | undefined) {
                      if (newVal === undefined) {
                        throw new Error(
                          `The property ${key} is required, but it is undefined.`,
                        );
                      }
                    },
                  });
                }

                if ('validator' in prop) {
                  delete prop.validator;
                }

                return [key, prop];
              }

              return [key, {}];
            }),
          )
      : undefined;

  return io || properties ? { ...io, ...properties } : undefined;
}
