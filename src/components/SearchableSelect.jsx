import { useState, useRef } from 'react'

export default function SearchableSelect({ options, value, onChange, placeholder = 'Search…', disabled = false }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  const filtered = query
    ? options.filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
    : options

  function select(opt) {
    onChange(opt)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : (value || '')}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { setOpen(true); setQuery('') }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b] bg-white disabled:bg-gray-50 disabled:text-gray-400"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={() => select(opt)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#d4e8ed] ${opt === value ? 'bg-[#d4e8ed] font-medium' : ''}`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No matches
        </div>
      )}
    </div>
  )
}
