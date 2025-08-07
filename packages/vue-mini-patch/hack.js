import { customRef, getCurrentInstance } from '@vue-mini/core';

export function hackRef(init, fakeKey) {
  const context = getCurrentInstance();

  context.$triggers ??= new Map();
  context.$storages ??= new Map();

  return customRef((track, trigger) => {
    context.$triggers.set(fakeKey, trigger);

    return {
      get() {
        track();

        return context.data[fakeKey] ?? init;
      },
    };
  });
}

export function hackOptions(options) {
  return {
    ...options,
    observers: {
      ...options.observers,
      '**': function (changed) {
        const { $storages, $triggers } = this;

        if ($triggers?.size > 0) {
          for (const [fakeKey, trigger] of $triggers.entries()) {
            if (fakeKey in changed) {
              const temp = changed[fakeKey];

              if (temp !== $storages.get(fakeKey)) {
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
