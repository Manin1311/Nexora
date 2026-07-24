import { useState, useEffect } from 'react'

/**
 * usePageTour — manages first-visit auto-show + manual replay for a page tour.
 *
 * Rules:
 *  1. Only auto-shows for FIRST-TIME ONBOARDING users during their initial session
 *     (sessionStorage key: nexora_is_first_time_onboarding = 'true').
 *  2. Only auto-shows if sidebar onboarding tour is done (localStorage key: nexora_tour_done = 'true').
 *  3. Auto-shows only once per page (key: nexora_page_tour_done_<pageKey>).
 *  4. Does NOT auto-show if preventAutoShow (e.g. active daily quest modal) is true.
 *  5. Users can always manually re-open via the ? Help button.
 *
 * @param {string} pageKey  - Unique id for this page, e.g. 'challenges'
 * @param {object} [options] - { preventAutoShow?: boolean }
 * @returns {{ isOpen: boolean, openTour: () => void, closeTour: () => void }}
 */
export function usePageTour(pageKey, options = {}) {
  const { preventAutoShow = false } = options
  const storageKey = `nexora_page_tour_done_${pageKey}`

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (preventAutoShow) return

    // Auto-show ONLY for first-time onboarding users during their initial session
    const isFirstTimeSession = sessionStorage.getItem('nexora_is_first_time_onboarding') === 'true'
    if (!isFirstTimeSession) return

    // Sidebar onboarding tour must be completed first
    const sidebarDone = localStorage.getItem('nexora_tour_done') === 'true'
    if (!sidebarDone) return

    // Must not have seen THIS page tour yet
    const pageDone = localStorage.getItem(storageKey) === 'true'
    if (pageDone) return

    // Delay so page layout stabilizes before tour overlay appears
    const t = setTimeout(() => setIsOpen(true), 800)
    return () => clearTimeout(t)
  }, [storageKey, preventAutoShow])

  const openTour = () => setIsOpen(true)

  const closeTour = () => {
    setIsOpen(false)
    localStorage.setItem(storageKey, 'true')
  }

  return { isOpen, openTour, closeTour }
}
