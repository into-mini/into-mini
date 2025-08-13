import { mergeProperties } from '@into-mini/vue-mini-patch/lib.ts';
import test from 'ava';

const fixtures = [
  [],
  ['a', 'b'],
  { a: null },
  { a: Boolean },
  { a: [] },
  { a: [Boolean] },
  { a: [Boolean, String, Number] },
  {
    a: {
      type: Boolean,
    },
  },

  {
    a: {
      type: [],
    },
  },
  {
    a: {
      type: [Boolean],
    },
  },
  {
    a: {
      type: [Boolean, String, Number],
    },
  },
  {
    a: {
      default: 4,
      required: true,
    },
  },
  {
    a: {
      default: () => [],
      required: false,
      validator: () => true,
    },
  },
  {
    a: {
      type: Boolean,
      optionalTypes: [String, Number],
    },
  },
  {
    a: {
      type: [Boolean, String, Number],
      optionalTypes: [Array, Object],
    },
  },
  {
    a: {
      default: 4,
      value: 5,
      observer() {},
    },
  },
];

for (const [idx, fixture] of Object.entries(fixtures)) {
  test(`toProperties - ${idx}`, async (t) => {
    t.snapshot(fixture);
    t.snapshot(mergeProperties(fixture));
  });
}
