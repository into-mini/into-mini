<template>
  <div class="setup-script-component">
    <p>{{ message }}</p>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const message = ref('Hello from setup script!');
const count = ref(0);

function increment() {
  count.value++;
}
</script>

<style>
.setup-script-component {
  text-align: center;
}
</style>
