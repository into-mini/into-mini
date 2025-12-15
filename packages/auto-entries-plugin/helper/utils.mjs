export const configKeys = {
  app: 'app-json',
  projectPrivate: 'project.private.config',
  project: 'project.config',
  hack: 'hack.entry',
};

export function toJSONString(object) {
  return JSON.stringify(object, null, 2);
}
