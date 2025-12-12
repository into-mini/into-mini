<template>.container h1 {{ title }} p {{ description }}</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'TestComponent',
  setup() {
    const title = ref('Test Title');
    const description = ref(
      'This is a test component with various lang attributes',
    );

    return {
      title,
      description,
    };
  },
});
</script>

<style lang="scss">
.container {
  padding: 20px;

  h1 {
    color: #333;
    font-size: 24px;
  }

  p {
    color: #666;
    font-size: 16px;
  }
}
</style>

<style lang="less">
.secondary {
  border-radius: 4px;
  background: #f5f5f5;
}
</style>

<i18n lang="json">
{
  "en": {
    "title": "Test Title",
    "description": "This is a test component"
  },
  "zh": {
    "title": "测试标题",
    "description": "这是一个测试组件"
  }
}
</i18n>
