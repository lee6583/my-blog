<script setup lang="ts">
import { computed, ref } from 'vue'
import YearSelect from './YearSelect.vue'

type StartOn = 'Mon' | 'Sun'

export interface DayWords {
  date: string
  words: number
  files?: number
}

interface Cell {
  date: string
  words: number
  files: number
  level: number
}

interface Column {
  monthLabel: string | null
  cells: (Cell | null)[]
}

const props = withDefaults(
  defineProps<{
    data: DayWords[]
    /** 可选年份列表，不传则从 data 中推导 + 当前年 */
    years?: number[]
    startOn?: StartOn
    thresholds?: [number, number, number, number]
  }>(),
  {
    startOn: 'Mon',
    thresholds: () => [1, 200, 600, 1200]
  }
)

const emit = defineEmits<{
  (e: 'cell-click', payload: Cell): void
}>()

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const currentYear = new Date().getFullYear()

const availableYears = computed(() => {
  if (props.years && props.years.length > 0) {
    return [...props.years].sort((a, b) => b - a)
  }
  const set = new Set<number>()
  set.add(currentYear)
  props.data.forEach((item) => {
    if (item?.date) {
      const y = Number(item.date.slice(0, 4))
      if (!Number.isNaN(y)) set.add(y)
    }
  })
  return Array.from(set).sort((a, b) => b - a)
})

const selectedYear = ref(currentYear)

function toLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 周起始为 Monday 时，返回该日期所在周的周一（同一天或更早） */
function getMondayBeforeOrOn(date: Date): Date {
  const d = toLocalMidnight(date)
  const day = d.getDay() // 0=Sun .. 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return monday
}

function getRowIndex(date: Date, _startOn: StartOn): number {
  const jsDay = date.getDay()
  return (jsDay + 6) % 7 // 0=Mon .. 6=Sun
}

function getLevel(words: number, thresholds: [number, number, number, number]): number {
  if (words <= 0) return 0
  const [t1, t2, t3, t4] = thresholds
  if (words < t1) return 0
  if (words < t2) return 1
  if (words < t3) return 2
  if (words < t4) return 3
  return 4
}

const byDate = computed(() => {
  const map = new Map<string, { words: number; files: number }>()
  props.data.forEach((item) => {
    if (!item?.date) return
    const key = item.date
    const prev = map.get(key) ?? { words: 0, files: 0 }
    prev.words += item.words || 0
    prev.files += item.files ?? (item.words > 0 ? 1 : 0)
    map.set(key, prev)
  })
  return map
})

/** 选定年份内的总字数 */
const totalWordsInYear = computed(() => {
  const y = selectedYear.value
  let sum = 0
  byDate.value.forEach((v, key) => {
    if (key.startsWith(String(y))) sum += v.words
  })
  return sum
})

/** 按选定年份生成列：从包含 1 月 1 日的那周的周一到包含 12 月 31 日的那周的周日 */
const columns = computed<Column[]>(() => {
  const startOn = props.startOn
  const thresholds = props.thresholds
  const map = byDate.value
  const year = selectedYear.value

  const jan1 = toLocalMidnight(new Date(year, 0, 1))
  const dec31 = toLocalMidnight(new Date(year, 11, 31))

  const firstMonday = getMondayBeforeOrOn(jan1)
  const lastMonday = getMondayBeforeOrOn(dec31)

  const cols: Column[] = []
  for (let mon = new Date(firstMonday); mon <= lastMonday; mon.setDate(mon.getDate() + 7)) {
    const cells: (Cell | null)[] = new Array(7).fill(null)
    for (let r = 0; r < 7; r += 1) {
      const d = new Date(mon)
      d.setDate(mon.getDate() + r)
      if (d < jan1 || d > dec31) continue
      const key = formatDateKey(d)
      const stats = map.get(key)
      const words = stats?.words ?? 0
      const files = stats?.files ?? 0
      const level = getLevel(words, thresholds)
      cells[r] = { date: key, words, files, level }
    }
    cols.push({ monthLabel: null, cells })
  }

  let lastLabeledMonth: number | null = null
  cols.forEach((col) => {
    const firstCell = col.cells.find((c) => c !== null)
    if (!firstCell) return
    const monthIndex = Number(firstCell.date.slice(5, 7)) - 1
    if (lastLabeledMonth === null || monthIndex !== lastLabeledMonth) {
      lastLabeledMonth = monthIndex
      col.monthLabel = MONTH_LABELS[monthIndex]
    }
  })

  return cols
})

function handleCellClick(cell: Cell | null) {
  if (!cell || !cell.words) return
  emit('cell-click', cell)
}

function cellTitle(cell: Cell | null): string | undefined {
  if (!cell) return undefined
  const base = `${cell.date}: ${cell.words} words`
  if (cell.files > 0) return `${base} · ${cell.files} files`
  return base
}
</script>

<template>
  <section class="ghx-heatmap">
    <header class="ghx-heatmap__header">
      <span class="ghx-heatmap__title-text">
        <YearSelect
          v-model="selectedYear"
          :years="availableYears"
          class="ghx-heatmap__year-select-wrap"
        />
        共编辑
        <strong class="ghx-heatmap__title-count">{{ totalWordsInYear.toLocaleString() }}</strong>
        字
      </span>
    </header>

    <div class="ghx-heatmap__body">
      <div class="ghx-heatmap__y">
        <span class="ghx-heatmap__y-cell">Mon</span>
        <span class="ghx-heatmap__y-cell ghx-heatmap__y-cell--empty" />
        <span class="ghx-heatmap__y-cell">Wed</span>
        <span class="ghx-heatmap__y-cell ghx-heatmap__y-cell--empty" />
        <span class="ghx-heatmap__y-cell">Fri</span>
        <span class="ghx-heatmap__y-cell ghx-heatmap__y-cell--empty" />
        <span class="ghx-heatmap__y-cell ghx-heatmap__y-cell--empty" />
      </div>

      <div class="ghx-heatmap__main">
        <div class="ghx-heatmap__months">
          <span
            v-for="(col, index) in columns"
            :key="`m-${index}`"
            class="ghx-heatmap__month"
          >
            {{ col.monthLabel || '' }}
          </span>
        </div>

        <div class="ghx-heatmap__grid">
          <div
            v-for="(col, colIndex) in columns"
            :key="`c-${colIndex}`"
            class="ghx-heatmap__column"
          >
            <button
              v-for="(cell, rowIndex) in col.cells"
              :key="`c-${colIndex}-r-${rowIndex}`"
              type="button"
              class="ghx-heatmap__cell-wrapper"
              :title="cellTitle(cell)"
              @click="handleCellClick(cell)"
            >
              <span
                class="ghx-heatmap__cell"
                :class="cell ? `lv-${cell.level}` : 'lv-0 is-empty'"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="ghx-heatmap__legend">
      <span>Less</span>
      <span class="ghx-heatmap__legend-cell lv-0" />
      <span class="ghx-heatmap__legend-cell lv-1" />
      <span class="ghx-heatmap__legend-cell lv-2" />
      <span class="ghx-heatmap__legend-cell lv-3" />
      <span class="ghx-heatmap__legend-cell lv-4" />
      <span>More</span>
    </footer>
  </section>
</template>
