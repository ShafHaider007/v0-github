"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { ChevronUp } from "lucide-react"

const PANEL_STATES = {
  COLLAPSED: 0,
  PEEK: 1,
  HALF: 2,
  EXPANDED: 3,
}

export const SlidingPanel = forwardRef(({ children, className, totalPlots }, ref) => {
  const [panelState, setPanelState] = useState(PANEL_STATES.PEEK)
  const panelRef = useRef(null)
  const dragStartRef = useRef(null)
  const dragStartHeightRef = useRef(null)
  const lastTouchY = useRef(null)
  const velocityRef = useRef(0)
  const lastTouchTimeRef = useRef(0)
  const animationFrameRef = useRef(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    collapsePanel: () => {
      animateToState(PANEL_STATES.PEEK)
    },
    expandPanel: () => {
      animateToState(PANEL_STATES.EXPANDED)
    },
    getPanelState: () => panelState,
  }))

  // Get panel heights for different states
  const getPanelHeight = (state) => {
    if (!panelRef.current) return 0

    const windowHeight = window.innerHeight
    const safeAreaBottom = getSafeAreaBottom()

    switch (state) {
      case PANEL_STATES.COLLAPSED:
        return 40 // Just the handle visible
      case PANEL_STATES.PEEK:
        // Make sure the peek height doesn't cover map controls
        // Map controls are typically 120-150px from bottom
        return 100 // Reduced peek height to avoid covering controls
      case PANEL_STATES.HALF:
        return windowHeight / 2 // Half the screen
      case PANEL_STATES.EXPANDED:
        return windowHeight * 0.75 - safeAreaBottom // 75% of screen, accounting for safe area
      default:
        return 100
    }
  }

  // Get safe area bottom inset (for devices with home indicator like iPhone X+)
  const getSafeAreaBottom = () => {
    // Try to get the CSS environment variable for safe area bottom
    const safeAreaBottom = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--sat-bottom-inset") || "0",
    )
    return safeAreaBottom || 0
  }

  // Set initial height
  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.style.height = `${getPanelHeight(PANEL_STATES.PEEK)}px`
    }

    // Setup viewport height fix
    setupViewportHeightFix()

    // Setup safe area detection
    setupSafeAreaDetection()

    return () => {
      window.removeEventListener("resize", updateViewportHeight)
    }
  }, [])

  // Setup viewport height fix for mobile browsers
  const setupViewportHeightFix = () => {
    // Set initial viewport height
    updateViewportHeight()

    // Update on resize
    window.addEventListener("resize", updateViewportHeight)
  }

  // Update the viewport height CSS variable
  const updateViewportHeight = () => {
    // Set a CSS variable with the actual viewport height
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty("--vh", `${vh}px`)
  }

  // Setup safe area detection for notched devices
  const setupSafeAreaDetection = () => {
    // Check if the browser supports env() function for safe areas
    const supportsSafeArea = CSS.supports("padding-bottom: env(safe-area-inset-bottom)")

    if (supportsSafeArea) {
      // Apply safe area to root element
      document.documentElement.style.setProperty("--sat-bottom-inset", "env(safe-area-inset-bottom)")
    }
  }

  // Handle touch start
  const handleTouchStart = (e) => {
    dragStartRef.current = e.touches[0].clientY
    dragStartHeightRef.current = panelRef.current.offsetHeight
    lastTouchY.current = e.touches[0].clientY
    lastTouchTimeRef.current = Date.now()
    velocityRef.current = 0

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // Handle touch move
  const handleTouchMove = (e) => {
    if (dragStartRef.current === null) return

    const touchY = e.touches[0].clientY
    const deltaY = touchY - dragStartRef.current
    let newHeight = dragStartHeightRef.current - deltaY

    // Calculate velocity for momentum scrolling
    const now = Date.now()
    const dt = now - lastTouchTimeRef.current
    if (dt > 0) {
      // Negative velocity means dragging down, positive means dragging up
      velocityRef.current = (lastTouchY.current - touchY) / dt
    }
    lastTouchY.current = touchY
    lastTouchTimeRef.current = now

    // Constrain height
    const minHeight = getPanelHeight(PANEL_STATES.COLLAPSED)
    const maxHeight = getPanelHeight(PANEL_STATES.EXPANDED)
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight))

    // Apply new height
    panelRef.current.style.height = `${newHeight}px`

    // Prevent default to avoid scrolling the page
    e.preventDefault()
  }

  // Handle touch end
  const handleTouchEnd = () => {
    if (dragStartRef.current === null) return

    const currentHeight = panelRef.current.offsetHeight
    const velocity = velocityRef.current

    // Determine target state based on current height and velocity
    let targetState

    // Use velocity to determine if user was flicking
    if (Math.abs(velocity) > 0.5) {
      if (velocity > 0) {
        // Flicking upward
        targetState = panelState < PANEL_STATES.EXPANDED ? panelState + 1 : PANEL_STATES.EXPANDED
      } else {
        // Flicking downward
        targetState = panelState > PANEL_STATES.COLLAPSED ? panelState - 1 : PANEL_STATES.COLLAPSED
      }
    } else {
      // Based on position
      const collapsedHeight = getPanelHeight(PANEL_STATES.COLLAPSED)
      const peekHeight = getPanelHeight(PANEL_STATES.PEEK)
      const halfHeight = getPanelHeight(PANEL_STATES.HALF)
      const expandedHeight = getPanelHeight(PANEL_STATES.EXPANDED)

      if (currentHeight < (collapsedHeight + peekHeight) / 2) {
        targetState = PANEL_STATES.COLLAPSED
      } else if (currentHeight < (peekHeight + halfHeight) / 2) {
        targetState = PANEL_STATES.PEEK
      } else if (currentHeight < (halfHeight + expandedHeight) / 2) {
        targetState = PANEL_STATES.HALF
      } else {
        targetState = PANEL_STATES.EXPANDED
      }
    }

    // Animate to target state
    animateToState(targetState)

    // Reset drag state
    dragStartRef.current = null
  }

  // Animate to a specific state
  const animateToState = (state) => {
    setPanelState(state)
    const targetHeight = getPanelHeight(state)
    const startHeight = panelRef.current.offsetHeight
    const startTime = Date.now()
    const duration = 300 // ms

    const animateFrame = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Use easeOutQuart easing function for natural motion
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      const newHeight = startHeight + (targetHeight - startHeight) * easeProgress

      panelRef.current.style.height = `${newHeight}px`

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animateFrame)
      } else {
        animationFrameRef.current = null
      }
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(animateFrame)
  }

  // Toggle between states when clicking the handle
  const togglePanel = () => {
    const nextState = panelState === PANEL_STATES.EXPANDED ? PANEL_STATES.PEEK : PANEL_STATES.EXPANDED
    animateToState(nextState)
  }

  return (
    <div
      ref={panelRef}
      className={`fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-xl z-40 overflow-hidden transition-transform ${className}`}
      style={{
        height: getPanelHeight(PANEL_STATES.PEEK),
        touchAction: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Handle */}
      <div className="h-10 flex items-center justify-center cursor-pointer bg-gray-50 border-b" onClick={togglePanel}>
        <div className="w-12 h-1 bg-gray-300 rounded-full mb-1"></div>
        <ChevronUp
          className={`absolute right-4 h-5 w-5 text-gray-500 transition-transform ${
            panelState === PANEL_STATES.EXPANDED ? "rotate-180" : ""
          }`}
        />
        {totalPlots !== undefined && (
          <span className="absolute left-4 text-xs font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">
            {totalPlots} plots
          </span>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 40px)" }}>
        {children}
      </div>
    </div>
  )
})

SlidingPanel.displayName = "SlidingPanel"
