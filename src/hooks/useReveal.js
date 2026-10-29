import { useEffect } from 'react'

// Makes sections fade in as they scroll into view.
export function useReveal(key) {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let observer
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('reveal-in')
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.12 }
      )
      document.querySelectorAll('section[id]:not(#home)').forEach((el) => {
        el.classList.add('reveal')
        observer.observe(el)
      })
    }, 80)

    return () => {
      clearTimeout(timer)
      if (observer) observer.disconnect()
    }
  }, [key])
}