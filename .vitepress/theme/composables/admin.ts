import { inBrowser } from 'vitepress'
import { ref } from 'vue'

const ADMIN_STORAGE_KEY = 'ghx-admin-mode'
const ADMIN_PASSWORD = '200506'

const isAdminMode = ref(false)
const isAuthModalOpen = ref(false)
let initialized = false

function hydrateAdminMode() {
  if (initialized || !inBrowser) return
  initialized = true
  isAdminMode.value = localStorage.getItem(ADMIN_STORAGE_KEY) === '1'
}

function openAuthModal() {
  hydrateAdminMode()
  isAuthModalOpen.value = true
}

function closeAuthModal() {
  isAuthModalOpen.value = false
}

function verifyPassword(password: string): boolean {
  const ok = password === ADMIN_PASSWORD
  if (!ok) return false

  isAdminMode.value = true
  closeAuthModal()
  if (inBrowser) localStorage.setItem(ADMIN_STORAGE_KEY, '1')
  return true
}

function exitAdminMode() {
  isAdminMode.value = false
  if (inBrowser) localStorage.removeItem(ADMIN_STORAGE_KEY)
}

export function useAdminMode() {
  hydrateAdminMode()

  return {
    isAdminMode,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    verifyPassword,
    exitAdminMode
  }
}
