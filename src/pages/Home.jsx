import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [stores, setStores] = useState([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('stores')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (error) setError('Failed to load stores.')
        else setStores(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <header className="bg-[#1e3d4a] px-5 h-14 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <h1 className="text-[#f5f0e8] font-semibold text-lg tracking-tight">Option Count</h1>
        <button
          onClick={() => navigate('/admin')}
          className="text-[#c8b89a] text-xs border border-[#c8b89a]/40 px-3 py-1 rounded-full hover:bg-[#c8b89a]/10 transition-colors"
        >
          ADMIN
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] p-8 w-full max-w-sm">
          <h2 className="text-[#1e3d4a] text-2xl font-semibold mb-1">Select Store</h2>
          <p className="text-[#5a7180] text-sm mb-6">Choose the store you&apos;re counting for</p>

          {loading && <p className="text-[#5a7180] text-sm">Loading stores…</p>}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {!loading && !error && (
            <>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="w-full border border-[#ede5d4] rounded-lg px-3 py-2.5 text-[#1a2e35] bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a6b] mb-4 text-sm"
              >
                <option value="">— Select a store —</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                onClick={() => selected && navigate(`/count/${selected}`)}
                disabled={!selected}
                className="w-full bg-[#2d5a6b] text-white py-2.5 rounded-lg font-medium hover:bg-[#1e3d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Start Count
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
