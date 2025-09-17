import { resolve } from './resolve.ts';
import type { CurrentRoute, Resolved, Routes } from './type.d.ts';

class BaseRouter {
  history: typeof wx;

  constructor() {
    this.history = wx;
  }

  async push({ fullPath: url, meta }: Resolved) {
    return meta?.tab
      ? this.history.switchTab({ url })
      : this.history.navigateTo({ url });
  }

  async replace({ fullPath: url, meta }: Resolved) {
    return meta?.tab
      ? this.history.switchTab({ url })
      : this.history.redirectTo({ url });
  }

  async back(fallback?: Resolved) {
    return this.history.navigateBack({ delta: 1 }).catch((error) => {
      if (fallback?.name) {
        return this.replace(fallback);
      }

      throw error;
    });
  }
}

export class Router extends BaseRouter {
  routes: Routes = [];

  constructor({ routes = [] }: { routes?: Routes }) {
    super();
    this.routes = routes;
  }

  override async push(route: CurrentRoute) {
    const to = resolve(this.routes, route);

    if (to) {
      return super.push(to);
    }

    throw new Error(`页面 "${route}" 不存在`);
  }

  override async replace(route: CurrentRoute) {
    const to = resolve(this.routes, route);

    if (to) {
      return super.replace(to);
    }

    throw new Error(`页面 "${route}" 不存在`);
  }

  onError(error: Error) {
    throw error;
  }

  resolve(route: CurrentRoute): Resolved | false {
    return resolve(this.routes, route);
  }

  resolveCurrent(): Resolved | false {
    const page = getCurrentPages().at(-1);

    return page
      ? this.resolve({
          path: page.route,
          query: page.options,
        })
      : false;
  }

  getRoutes(): Routes {
    return this.routes;
  }

  isReady(): boolean {
    return this.getRoutes().length > 0;
  }
}
