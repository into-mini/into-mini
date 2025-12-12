<template>
  <div class="simple-component">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>

<script>
export default {
  name: 'SimpleComponent',
  data() {
    return {
      title: 'Hello World',
      description: 'This is a simple Vue component for testing.',
    };
  },
};
</script>

<style>
.simple-component {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 20px;
}

.simple-component h1 {
  color: #42b983;
}
</style>
