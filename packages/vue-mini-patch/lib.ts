interface ComponentOptions {
  props?: ArrayPropsOptions | ObjectPropsOptions;
}

type ArrayPropsOptions = string[];

type ObjectPropsOptions = { [key: string]: Prop };

type Prop<T = any> = PropOptions<T> | PropType<T> | null;

interface PropOptions<T> {
  type?: PropType<T>;
  required?: boolean;
  default?: T | ((rawProps: object) => T);
  validator?: (value: unknown, rawProps: object) => boolean;
}

type PropType<T> = { new (): T } | { new (): T }[];

export function mergeProperties(
  props?: ComponentOptions['props'],
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
                const temp =
                  prop.length === 0
                    ? {}
                    : prop.length === 1
                      ? { type: prop[0] }
                      : {
                          type: prop[0],
                          optionalTypes: prop.slice(1),
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
