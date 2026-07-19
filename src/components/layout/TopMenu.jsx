import { useState } from 'react'
import homeQIcon from '../../assets/home-qicon.png'
import { MENU_GROUPS } from '../../config/navigation.js'

export default function TopMenu({ activePage, onSelect }) {
  const [openMenu, setOpenMenu] = useState(null)

  const selectPage = pageId => {
    onSelect(pageId)
    setOpenMenu(null)
  }

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#1f1f1f]/95 px-6 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3">
        <button
          type="button"
          onClick={() => selectPage('home')}
          className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded border text-lg transition-colors ${activePage === 'home' ? 'border-neutral-500 bg-neutral-700 text-white' : 'border-neutral-700 bg-[#2a2a2a] text-gray-300 hover:border-neutral-500 hover:text-gray-100'}`}
          aria-label="홈"
        >
          <img src={homeQIcon} alt="" className="h-full w-full object-cover" />
        </button>
        <div className="mr-auto">
          <div className="text-sm font-bold text-gray-100">AzurLane Tracker</div>
          <div className="text-[11px] text-gray-500">벽람항로 개인용 함선 육성툴</div>
        </div>
        <nav className="flex flex-wrap justify-end gap-2">
          {MENU_GROUPS.map(group => (
            <MenuDropdown
              key={group.label}
              group={group}
              activePage={activePage}
              isOpen={openMenu === group.label}
              onOpen={() => setOpenMenu(group.label)}
              onClose={() => setOpenMenu(null)}
              onSelect={selectPage}
            />
          ))}
        </nav>
      </div>
    </header>
  )
}

function MenuDropdown({ group, activePage, isOpen, onOpen, onClose, onSelect }) {
  const isActive = group.items.some(item => item.id === activePage)

  return (
    <div
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose()
      }}
    >
      <button
        type="button"
        onClick={() => isOpen ? onClose() : onOpen()}
        aria-expanded={isOpen}
        className={`h-10 rounded border px-4 text-sm font-semibold transition-colors ${isActive ? 'border-neutral-500 bg-neutral-700 text-white' : 'border-neutral-700 bg-[#2a2a2a] text-gray-200 hover:border-neutral-500'}`}
      >
        {group.label} ▾
      </button>
      <div className={`${isOpen ? 'visible translate-y-1 opacity-100' : 'invisible translate-y-2 opacity-0'} absolute right-0 top-full z-40 w-[360px] rounded border border-neutral-700 bg-[#1f1f1f] p-3 shadow-2xl shadow-black/50 transition-all`}>
        <div className="mb-2 px-2 text-xs text-gray-500">{group.label}</div>
        <div className="space-y-1">
          {group.items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`w-full rounded px-3 py-3 text-left transition-colors ${activePage === item.id ? 'bg-neutral-700 text-white' : 'text-gray-200 hover:bg-[#2a2a2a]'}`}
            >
              <div className="text-sm font-bold">{item.title}</div>
              <div className="mt-1 text-xs leading-5 text-gray-500">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
