import { customRef, getCurrentInstance, ref } from 'vue';
import type { ComponentInternalInstance } from 'vue';
import type { MixComponentOptions } from './type.d.ts';

type MixInstance = ComponentInternalInstance & {
  $triggers?: Map<string, () => void>;
  $storages?: Map<string, unknown>;
};

export function hackRef(init: unknown, fakeKey: string) {
  const context = getCurrentInstance() as MixInstance;

  if (!context) {
    return ref(init);
  }

  context.$triggers ??= new Map();
  context.$storages ??= new Map();

  return customRef((track, trigger) => {
    context.$triggers?.set(fakeKey, trigger);

    return {
      get() {
        track();

        return context.data[fakeKey] ?? init;
      },
      set(value) {
        const io =
          context as unknown as WechatMiniprogram.Component.InstanceMethods<WechatMiniprogram.Component.DataOption>;

        io.setData({ [fakeKey]: value ?? init }, () => {
          trigger();
        });
      },
    };
  });
}

export function hackOptions(options: MixComponentOptions): MixComponentOptions {
  return {
    ...options,
    observers: {
      ...options.observers,
      '**': function all(changed: Record<string, unknown>) {
        const { $storages, $triggers } = this as unknown as MixInstance;

        if ($triggers && $triggers?.size > 0) {
          for (const [fakeKey, trigger] of $triggers.entries()) {
            if (fakeKey in changed) {
              const temp = changed[fakeKey];

              if ($storages && temp !== $storages.get(fakeKey)) {
                $storages.set(fakeKey, temp);
                trigger();
              }
            }
          }
        }
      },
    },
  };
}
