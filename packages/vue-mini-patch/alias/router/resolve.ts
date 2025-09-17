import { encode } from 'qss';
import type { CurrentRoute, Resolved, Routes } from './type.d.ts';

export function resolve(
  routes: Routes = [],
  { name, path = '/', query }: CurrentRoute,
): Resolved | false {
  const match =
    routes.find((define) => define.name === name) ||
    routes.find((define) => 'path' in define && define.path === `/${path}`);

  if (name) {
    if (match) {
      const qy = query ? encode(query) : '';

      return {
        meta: match.meta,
        path: match.path,
        fullPath: qy ? `${match.path}?${qy}` : match.path,
        params: query,
        query,
      };
    }

    return false;
  }

  const qy = query ? encode(query) : '';

  return {
    path,
    fullPath: qy ? `${path}?${qy}` : path,
    params: query,
    query,
  };
}
