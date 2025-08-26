import test from 'ava';
import { parse } from '@into-mini/sfc-transformer';

function html([string]: TemplateStringsArray) {
  return string ? string.trim() : '';
}

const fixtures = html`
  <template>
    <t-cell />
  </template>

  <script setup>
    import Tag from '@test/tag.vue';
  </script>
`;

test('base', (t) => {
  const io = parse(fixtures);

  t.snapshot(io);
});

test('tags', (t) => {
  const io = parse(fixtures, {
    tagMatcher(tag: string) {
      if (tag.startsWith('t-')) {
        return {
          tag,
          path: 'abcd',
        };
      }

      return false;
    },
  });

  t.snapshot(io);
});
