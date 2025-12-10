<template>
  <div
    class="wrapper"
    :class="color.startsWith('#') ? undefined : colorClass"
    :style="color.startsWith('#') ? { color } : undefined"
  >
    <NxIconify class="icon" :class="iconName" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import NxIconify from './iconify.vue';

// 图标映射表
const ICON_MAP = {
  success: 'heroicons--check-circle-solid',
  info: 'heroicons--information-circle-solid',
  warn: 'heroicons--exclamation-circle-solid',
  waiting: 'heroicons--clock-solid',
  cancel: 'heroicons--x-circle',
  download: 'heroicons--arrow-down-circle',
  search: 'heroicons--magnifying-glass',
  circle: 'sidekickicons--circle',
  info_circle: 'heroicons--information-circle',
  success_no_circle: 'heroicons--check',
};

// 颜色映射表
const COLOR_MAP = {
  default: 'text-gray-600',
  primary: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  danger: 'text-red-500',
};

// 定义组件属性
const props = defineProps({
  // 图标类型
  type: {
    type: String,
    required: true,
  },
  // 图标颜色
  color: {
    type: String,
    default: '',
  },
});

// 计算图标名称
const iconName = computed(() => ICON_MAP[props.type] || '');

const colorClass = computed(() => {
  if (props.color.startsWith('#')) {
    return props.color;
  }

  // 使用预设颜色
  return COLOR_MAP[props.type];
});
</script>

<script>
// 为了兼容性，保留组件名称定义
export default {
  name: 'WxIcon',
};
</script>

<style scoped>
.wrapper {
  @apply inline-flex items-center justify-center;
}

.icon {
  @apply size-full;
}
</style>
