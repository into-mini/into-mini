<template>
  <div class="multi-style-component">
    <h2>{{ heading }}</h2>
    <p>{{ content }}</p>
  </div>
</template>

<script>
export default {
  name: 'MultipleStylesComponent',
  props: {
    heading: {
      type: String,
      default: 'Default Heading',
    },
    content: {
      type: String,
      default: 'Default content',
    },
  },
};
</script>

<style>
.multi-style-component {
  font-family: Arial, sans-serif;
}
</style>

<style lang="scss">
.multi-style-component {
  h2 {
    color: #333;
    font-size: 24px;
  }

  p {
    color: #666;
    line-height: 1.5;
  }
}
</style>

<config lang="json">
{
  "en": {
    "title": "Test Title",
    "description": "This is a test component"
  }
}
</config>
