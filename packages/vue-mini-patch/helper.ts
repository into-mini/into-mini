import { mergeProperties } from './lib.ts';
import type { MiniComponentOptions, MixComponentOptions } from './type.d.ts';

export function mergeOptions({
  name,
  props,
  properties,
  lifetimes,
  data,
  methods,
  emits,
  created,
  beforeCreate,
  mixins = [],
  behaviors = [],
  ...rest
}: MixComponentOptions): MiniComponentOptions {
  return {
    ...rest,
    properties:
      props || properties ? mergeProperties(props, properties) : undefined,
    data: data && typeof data === 'function' ? data() : data,
    behaviors:
      mixins.length > 0 || behaviors.length > 0
        ? [...mixins, ...behaviors]
        : undefined,
    methods: {
      $emit(event: string, detail?: unknown) {
        this.triggerEvent(event, detail);
      },
      ...methods,
    },
    lifetimes: {
      ...lifetimes,
      created() {
        if (beforeCreate) {
          beforeCreate.apply(this);
        }

        if (created) {
          created.apply(this);
        }

        if (lifetimes?.created) {
          lifetimes.created.apply(this);
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
    },
  };
}
