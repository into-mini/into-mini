import { inject, reactive, readonly } from '@vue-mini/core';

import { Router } from './router.ts';
import type { hackedApp } from '../core.ts';
import type { Resolved, Routes } from './type.d.ts';

const $$router = '$$router';
const $$route = '$$route';

export function createRouter({ routes }: { routes: Routes }) {
  const router = readonly<Router>(new Router({ routes }));
  const route = reactive<Resolved>({ path: '/', fullPath: '/' });

  return Object.freeze({
    install(app: hackedApp) {
      app.provide($$router, router);
      app.provide($$route, route);

      wx.onAppRoute((res) => {
        const tmp = router.resolve({ path: res.path, query: res.query });

        if (tmp) {
          Object.assign(route, tmp);
        }
      });

      wx.onAfterPageLoad((res) => {
        const tmp = router.resolve({ path: res.path, query: res.query });

        if (tmp) {
          Object.assign(route, tmp);
        }
      });

      setTimeout(() => {
        const io = router.resolveCurrent();

        if (io && io?.fullPath && io.fullPath !== '/') {
          Object.assign(route, io);
        }
      }, 10);

      Object.defineProperties(app.globalData, {
        $router: {
          get() {
            return router;
          },
        },
        $route: {
          get() {
            return router.resolveCurrent();
          },
        },
      });
    },
  });
}

export function useRouter() {
  return inject<Router>($$router);
}

export function useRoute() {
  const router = useRouter();
  const route = inject<Resolved>($$route);

  return new Proxy(route || ({} as Resolved), {
    get(target, key: keyof Resolved) {
      if (!target?.fullPath || target?.fullPath === '/') {
        const io = router?.resolveCurrent();

        return io ? io[key] : undefined;
      }

      return key in target ? target[key] : undefined;
    },
  });
}

export function createWebHistory() {}
