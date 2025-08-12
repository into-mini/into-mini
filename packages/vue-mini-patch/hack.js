import { customRef, getCurrentInstance, ref } from 'vue';

export function hackRef(init, fakeKey) {
  const context = getCurrentInstance();

  if (!context) {
    return ref(init);
  }

  context.$triggers ??= new Map();
  context.$storages ??= new Map();

  return customRef((track, trigger) => {
    context.$triggers.set(fakeKey, trigger);

    return {
      get() {
        track();

        return context.data[fakeKey] ?? init;
      },
      set(value) {
        context.setData({ [fakeKey]: value ?? init }, () => {
          trigger();
        });
      },
    };
  });
}

export function hackOptions(options) {
  return {
    ...options,
    observers: {
      ...options.observers,
      '**': function all(changed) {
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
