import { mergeProperties } from './lib.ts';

export function mergeOptions({
  name,
  props,
  properties,
  data,
  methods,
  emits,
  created,
  beforeCreate,
  mixins = [],
  behaviors = [],
  ...rest
}) {
  return {
    ...rest,
    properties: mergeProperties(props, properties),
    data: typeof data === 'function' ? data() : data,
    behaviors: [...mixins, ...behaviors],
    methods: {
      $emit(event, ...args) {
        this.triggerEvent(event, ...args);
      },
      ...methods,
    },
    created(...options) {
      if (beforeCreate) {
        beforeCreate.apply(this, options);
      }

      if (created) {
        created.apply(this, options);
      }

      Object.defineProperties(this, {
        props: {
          enumerable: true,
          configurable: false,
          get() {
            return this.properties;
          },
        },
        $props: {
          enumerable: true,
          configurable: false,
          get() {
            return this.properties;
          },
        },
      });
    },
  };
}
