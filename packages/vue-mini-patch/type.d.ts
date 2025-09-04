import type { ComponentOptions } from 'vue'

import { defineComponent, definePage } from '@vue-mini/core'

export type MiniComponentOptions = Parameters<typeof defineComponent>[0]

export type MiniPageOptions = Parameters<typeof definePage>[0]

export interface MixComponentOptions extends MiniComponentOptions {
  data?: (() => MiniComponentOptions['data']) | MiniComponentOptions['data']
  name?: ComponentOptions['name']
  props?: ComponentOptions['props']
  emits?: ComponentOptions['emits']
  mixins?: ComponentOptions['mixins']
  created?: ComponentOptions['created']
  beforeCreate?: ComponentOptions['beforeCreate']
}

export interface MixPageOptions extends MiniPageOptions {
  data?: (() => MiniPageOptions['data']) | MiniPageOptions['data']
  name?: ComponentOptions['name']
  created?: ComponentOptions['created']
  beforeCreate?: ComponentOptions['beforeCreate']
  options: MiniPageOptions['options'] & {
    isPage: true
  }
}
