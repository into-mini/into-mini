import { pretty } from './pretty.mjs';

export default function loader(source) {
  this.cacheable();
  const callback = this.async();

  try {
    callback(null, pretty(source));
  } catch (error) {
    console.error(error);
    callback(null, source);
  }
}
