import { inject, reactive, readonly } from '@vue-mini/core';

import { Router } from './router.ts';
import type { hackedApp } from '../core.ts';
import type { Resolved, Routes } from './type.d.ts';

const $$router = '$$router';
const $$route = '$$route';

export function createRouter({ routes }: { routes: Routes }) {
  const router = readonly<Router>(new Router({ routes }));
  const route = reactive<Resolved>({ path: '/', fullPath: '/' });

  function update(
    res:
      | WechatMiniprogram.OnAppRouteListenerResult
      | WechatMiniprogram.OnAfterPageLoadListenerResult,
  ): void {
    const tmp = router.resolve({ path: res.path, query: res.query });

    if (tmp) {
      Object.assign(route || {}, tmp);
    }
  }

  return Object.freeze({
    install(app: hackedApp) {
      app.provide($$router, router);
      app.provide($$route, route);

      wx.onAppRoute((res) => {
        update(res);
      });

      wx.onAfterPageLoad((res) => {
        update(res);
      });

      setTimeout(() => {
        const io = router.resolveCurrent();

        if (io && io.fullPath && io.fullPath !== '/') {
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
  return inject<Resolved>($$route);
}

export function createWebHistory() {}
