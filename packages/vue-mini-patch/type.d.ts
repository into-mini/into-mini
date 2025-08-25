import type { ComponentOptions } from 'vue'

import { defineComponent } from '@vue-mini/core'

export type MiniComponentOptions = Parameters<typeof defineComponent>[0]

export interface MixComponentOptions extends MiniComponentOptions {
  data?: (() => MiniComponentOptions['data']) | MiniComponentOptions['data']
  name?: ComponentOptions['name']
  props?: ComponentOptions['props']
  emits?: ComponentOptions['emits']
  mixins?: ComponentOptions['mixins']
  created?: ComponentOptions['created']
  beforeCreate?: ComponentOptions['beforeCreate']
}
