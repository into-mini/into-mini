<template>
  <div class="class icon name" />
</template>

<script>
export default {
  name: 'Iconify',
  externalClasses: ['class', 'name'],
  options: {
    virtualHost: true,
  },
};
</script>

<style scoped>
.icon {
  @apply iconify;
}
</style>
