export function getDropdownMenuPosition({
  buttonRect,
  menuRect,
  viewport,
  gap = 4,
  padding = 8,
  minWidth = 80,
}) {
  const availableWidth = Math.max(0, viewport.width - padding * 2)
  const width = Math.min(
    Math.max(buttonRect.width, menuRect.width, minWidth),
    availableWidth,
  )
  const left = clamp(buttonRect.left, padding, Math.max(padding, viewport.width - padding - width))
  const spaceBelow = Math.max(0, viewport.height - padding - buttonRect.bottom - gap)
  const spaceAbove = Math.max(0, buttonRect.top - gap - padding)
  const placement = spaceBelow >= menuRect.height || spaceBelow >= spaceAbove ? 'bottom' : 'top'
  const availableHeight = placement === 'bottom' ? spaceBelow : spaceAbove
  const maxHeight = Math.min(menuRect.height, availableHeight)
  const visibleHeight = Math.min(menuRect.height, maxHeight)
  const top = placement === 'bottom'
    ? buttonRect.bottom + gap
    : Math.max(padding, buttonRect.top - gap - visibleHeight)

  return { left, top, width, maxHeight, placement }
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}
