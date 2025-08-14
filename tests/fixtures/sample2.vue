<template>
  <t-picker v-model:value="datetime" />
  <div>
    <t-picker v-model="datetime" />
  </div>
  <t-picker v-model="datetime" />
  <t-picker v-model="datetime" />
  <div>
    <div>
      <t-picker v-model="datetime" />
    </div>
  </div>
</template>

<script setup>
const datetime = ref('2017');
</script>
