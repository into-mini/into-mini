<template>
  {{ kkk }}
  <textarea v-model="kkk" />
</template>

<script setup>
import { watchEffect, ref } from '@vue-mini/core';
import { hackRef } from '@into-mini/vue-mini-patch/hack.js';

const kkk = hackRef('111', 'kkk');

watchEffect(() => {
  console.log(kkk.value);
});
</script>

<script>
export default {
  options: {
    hacked: true,
  },
  data() {
    return {
      kkk: '111',
    };
  },
};
</script>
