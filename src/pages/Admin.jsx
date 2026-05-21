import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { exportSingle, exportBulk } from '../lib/export'

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState(false)
  const navigate = useNavigate()

  function tryLogin() {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setPwError(true)
      setPassword('')
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
        <header className="bg-[#1e3d4a] px-5 h-14 flex items-center shadow-lg">
          <button onClick={() => navigate('/')} className="text-[#c8b89a] text-sm mr-4">
            ← Back
          </button>
          <h1 className="text-[#f5f0e8] font-semibold">Admin</h1>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] p-8 w-full max-w-sm">
            <h2 className="text-[#1a2e35] text-xl font-semibold mb-6">Enter Password</h2>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPwError(false) }}
              onKeyDown={e => e.key === 'Enter' && tryLogin()}
              placeholder="Password"
              autoFocus
              className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b] mb-3 ${pwError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {pwError && (
              <p className="text-red-500 text-sm mb-3">Incorrect password</p>
            )}
            <button
              onClick={tryLogin}
              className="w-full bg-[#2d5a6b] text-white py-2.5 rounded-lg font-medium hover:bg-[#1e3d4a] transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />
}

function AdminDashboard({ onLogout }) {
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase
      .from('option_count_submissions')
      .select(`
        *,
        stores (name),
        submission_sections (
          *,
          submission_fixtures (*)
        )
      `)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSubmissions(data)
        setLoading(false)
      })
  }, [])

  function totalFor(sub) {
    let ideal = 0, actual = 0
    for (const sec of sub.submission_sections || []) {
      for (const fx of sec.submission_fixtures || []) {
        ideal += Number(fx.ideal_total) || 0
        actual += Number(fx.actual_total) || 0
      }
    }
    return { ideal, actual }
  }

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === submissions.length) setSelected(new Set())
    else setSelected(new Set(submissions.map(s => s.id)))
  }

  async function handleBulkExport() {
    const subs = submissions.filter(s => selected.has(s.id))
    await exportBulk(subs)
  }

  async function handleDeleteSelected() {
    if (!window.confirm(`Permanently delete ${selected.size} submission${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return

    setDeleting(true)
    try {
      const toDelete = submissions.filter(s => selected.has(s.id))
      const submissionIds = toDelete.map(s => s.id)
      const sectionIds = toDelete.flatMap(s => (s.submission_sections || []).map(sec => sec.id))

      if (sectionIds.length > 0) {
        const { error } = await supabase.from('submission_fixtures').delete().in('section_id', sectionIds)
        if (error) throw error
      }

      // Delete storage photos, one submission folder at a time
      for (const submissionId of submissionIds) {
        const { data: files } = await supabase.storage.from('section-photos').list(submissionId)
        if (files && files.length > 0) {
          await supabase.storage.from('section-photos').remove(files.map(f => `${submissionId}/${f.name}`))
        }
      }

      if (submissionIds.length > 0) {
        const { error: secErr } = await supabase.from('submission_sections').delete().in('submission_id', submissionIds)
        if (secErr) throw secErr
        const { error: subErr } = await supabase.from('option_count_submissions').delete().in('id', submissionIds)
        if (subErr) throw subErr
      }

      setSubmissions(prev => prev.filter(s => !selected.has(s.id)))
      setSelected(new Set())
      if (expandedId && selected.has(expandedId)) setExpandedId(null)
    } catch (err) {
      window.alert('Delete failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#1e3d4a] px-5 h-14 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-[#c8b89a] text-sm">
            ← Stores
          </button>
          <h1 className="text-[#f5f0e8] font-semibold">Admin Dashboard</h1>
        </div>
        <button
          onClick={onLogout}
          className="text-[#c8b89a] text-xs border border-[#c8b89a]/40 px-3 py-1 rounded-full hover:bg-[#c8b89a]/10 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {loading ? (
          <p className="text-[#5a7180] text-sm py-8 text-center">Loading submissions…</p>
        ) : submissions.length === 0 ? (
          <p className="text-[#5a7180] text-sm py-8 text-center">No submissions yet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <p className="text-sm text-[#5a7180] mr-auto">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </p>
              {selected.size > 0 && (
                <>
                  <button
                    onClick={handleBulkExport}
                    disabled={deleting}
                    className="bg-[#2d5a6b] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#1e3d4a] transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    Export {selected.size} selected (.zip)
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={deleting}
                    className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
                  >
                    {deleting ? 'Deleting…' : `Delete ${selected.size} selected`}
                  </button>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={selected.size === submissions.length && submissions.length > 0}
                          onChange={toggleAll}
                          className="rounded"
                        />
                      </th>
                      <th className="p-3 text-left text-[#5a7180] font-medium">Store</th>
                      <th className="p-3 text-left text-[#5a7180] font-medium">Submitted By</th>
                      <th className="p-3 text-left text-[#5a7180] font-medium hidden sm:table-cell">Date</th>
                      <th className="p-3 text-right text-[#5a7180] font-medium hidden md:table-cell">Ideal</th>
                      <th className="p-3 text-right text-[#5a7180] font-medium hidden md:table-cell">Actual</th>
                      <th className="p-3 text-right text-[#5a7180] font-medium hidden md:table-cell">Diff</th>
                      <th className="p-3 text-center text-[#5a7180] font-medium">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => {
                      const { ideal, actual } = totalFor(sub)
                      const diff = actual - ideal
                      const isExpanded = expandedId === sub.id
                      return (
                        <Fragment key={sub.id}>
                          <tr
                            className={`border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors ${isExpanded ? 'bg-[#d4e8ed]/30' : ''}`}
                            onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                          >
                            <td className="p-3" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected.has(sub.id)}
                                onChange={() => toggleSelect(sub.id)}
                                className="rounded"
                              />
                            </td>
                            <td className="p-3 font-medium text-[#1a2e35]">
                              {sub.stores?.name || '—'}
                            </td>
                            <td className="p-3 text-[#5a7180]">{sub.submitted_by}</td>
                            <td className="p-3 text-[#5a7180] hidden sm:table-cell">
                              {new Date(sub.submitted_at).toLocaleDateString('en-GB', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </td>
                            <td className="p-3 text-right hidden md:table-cell text-[#1a2e35]">
                              {ideal}
                            </td>
                            <td className="p-3 text-right hidden md:table-cell text-[#1a2e35]">
                              {actual}
                            </td>
                            <td className={`p-3 text-right font-medium hidden md:table-cell ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {diff > 0 ? '+' : ''}{diff}
                            </td>
                            <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => exportSingle(sub)}
                                className="text-[#2d5a6b] hover:text-[#1e3d4a] text-xs font-medium underline"
                              >
                                .xlsx
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="p-0 border-b border-gray-100">
                                <SubmissionDetail sub={sub} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SubmissionDetail({ sub }) {
  const sections = [...(sub.submission_sections || [])]
    .sort((a, b) => a.section_number - b.section_number)

  return (
    <div className="bg-[#f5f0e8] p-4">
      <p className="text-xs text-[#5a7180] mb-3 font-medium uppercase tracking-wide">
        Full breakdown — {sub.stores?.name} — {sub.submitted_by}
      </p>
      {sections.map(sec => (
        <div key={sec.id} className="mb-3">
          <div className="flex items-baseline gap-3 mb-1.5">
            <p className="text-xs font-semibold text-[#1a2e35] uppercase tracking-wide">
              {sec.section_label}
            </p>
            {sec.comment && (
              <p className="text-xs text-[#5a7180] italic">"{sec.comment}"</p>
            )}
          </div>
          {sec.photo_url && (
            <img
              src={sec.photo_url}
              alt={`${sec.section_label} photo`}
              className="w-full rounded-xl mb-2 object-cover max-h-48 border border-[#ede5d4]"
            />
          )}
          <div className="bg-white rounded-xl border border-[#ede5d4] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-2 text-left text-[#5a7180] font-medium">Fixture</th>
                    <th className="p-2 text-left text-[#5a7180] font-medium hidden sm:table-cell">
                      Department
                    </th>
                    <th className="p-2 text-right text-[#5a7180] font-medium">Qty</th>
                    <th className="p-2 text-right text-[#5a7180] font-medium hidden sm:table-cell">
                      Ideal/fx
                    </th>
                    <th className="p-2 text-right text-[#5a7180] font-medium hidden sm:table-cell">
                      Act/fx
                    </th>
                    <th className="p-2 text-right text-[#5a7180] font-medium">Ideal</th>
                    <th className="p-2 text-right text-[#5a7180] font-medium">Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {(sec.submission_fixtures || []).map(fx => (
                    <tr key={fx.id} className="border-b border-gray-50 last:border-0">
                      <td className="p-2 text-[#1a2e35]">{fx.fixture_name}</td>
                      <td className="p-2 text-[#5a7180] hidden sm:table-cell">{fx.department}</td>
                      <td className="p-2 text-right text-[#5a7180]">{fx.quantity}</td>
                      <td className="p-2 text-right text-[#5a7180] hidden sm:table-cell">
                        {fx.ideal_options_per_fixture}
                      </td>
                      <td className="p-2 text-right text-[#5a7180] hidden sm:table-cell">
                        {fx.actual_options_per_fixture}
                      </td>
                      <td className="p-2 text-right text-[#1a2e35] font-medium">{fx.ideal_total}</td>
                      <td className="p-2 text-right text-[#1a2e35] font-medium">{fx.actual_total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
