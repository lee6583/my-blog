<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

defineProps<{
  modelValue: number
  years: number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function selectYear(y: number) {
  emit('update:modelValue', y)
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (
    open.value &&
    triggerRef.value &&
    !triggerRef.value.contains(target) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(target)
  ) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <div class="ghx-year-select">
    <button
      ref="triggerRef"
      type="button"
      class="ghx-year-select__trigger"
      :class="{ open: open }"
      aria-haspopup="listbox"
      :aria-expanded="open"
      aria-label="选择年份"
      @click="toggle"
    >
      <span class="ghx-year-select__label">{{ modelValue }} 年</span>
      <span class="ghx-year-select__icon" aria-hidden="true">▼</span>
    </button>

    <Transition name="ghx-year-select-drop">
      <div
        v-show="open"
        ref="dropdownRef"
        class="ghx-year-select__dropdown"
        role="listbox"
      >
        <button
          v-for="y in years"
          :key="y"
          type="button"
          class="ghx-year-select__option"
          :class="{ active: y === modelValue }"
          role="option"
          :aria-selected="y === modelValue"
          @click="selectYear(y)"
        >
          {{ y }} 年
        </button>
      </div>
    </Transition>
  </div>
</template>
