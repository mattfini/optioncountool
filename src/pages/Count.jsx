import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import SectionPanel from '../components/SectionPanel'
import Totals from '../components/Totals'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function emptyRow() {
  return { id: uid(), fixture_name: '', department: '', quantity: '', actual_options_per_fixture: '', product_story: '', product_story_comment: '' }
}

function emptySection() {
  return { id: uid(), fixtures: [emptyRow()], comment: '', photo: null }
}

function parseFixtureName(name) {
  const m = name.match(/^(\d+)MM\s+(.+)$/)
  return m ? { type: m[2], size: parseInt(m[1]) } : { type: name, size: Infinity }
}

function fixtureComparator(a, b) {
  const pa = parseFixtureName(a)
  const pb = parseFixtureName(b)
  if (pa.type !== pb.type) return pa.type.localeCompare(pb.type)
  return pa.size - pb.size
}

export default function Count() {
  const { storeId } = useParams()
  const navigate = useNavigate()

  const [store, setStore] = useState(null)
  const [fixtureIdeals, setFixtureIdeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const [submitterName, setSubmitterName] = useState('')
  const [sections, setSections] = useState([emptySection()])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [validationError, setValidationError] = useState(null)

  useEffect(() => {
    async function load() {
      const [storeRes, idealsRes] = await Promise.all([
        supabase.from('stores').select('id, name, layout_image_url, layout_image_url_2').eq('id', storeId).single(),
        supabase.from('fixture_ideals').select('fixture_name, department, ideal_options'),
      ])
      if (storeRes.error) setLoadError('Store not found.')
      else setStore(storeRes.data)
      if (idealsRes.data) setFixtureIdeals(idealsRes.data)
      setLoading(false)
    }
    load()
  }, [storeId])

  const fixtureNames = useMemo(
    () => [...new Set(fixtureIdeals.map(f => f.fixture_name))].sort(fixtureComparator),
    [fixtureIdeals]
  )

  const idealLookup = useMemo(() => {
    const m = new Map()
    for (const f of fixtureIdeals) {
      m.set(`${f.fixture_name.toLowerCase()}|${f.department.toLowerCase()}`, f.ideal_options)
    }
    return m
  }, [fixtureIdeals])

  const getIdeal = useCallback((fixtureName, department) => {
    if (!fixtureName || !department) return null
    const val = idealLookup.get(`${fixtureName.toLowerCase()}|${department.toLowerCase()}`)
    return val !== undefined ? val : null
  }, [idealLookup])

  const getDeptsForFixture = useCallback((fixtureName) => {
    return fixtureIdeals
      .filter(f => f.fixture_name.toLowerCase() === fixtureName.toLowerCase())
      .map(f => f.department)
  }, [fixtureIdeals])

  function sectionTotals(section) {
    let ideal = 0, actual = 0
    for (const row of section.fixtures) {
      const qty = parseFloat(row.quantity) || 0
      const actualPer = parseInt(row.actual_options_per_fixture) || 0
      const idealPer = (row.fixture_name && row.department)
        ? (getIdeal(row.fixture_name, row.department) || 0)
        : 0
      ideal += qty * idealPer
      actual += qty * actualPer
    }
    return { ideal, actual }
  }

  const grandTotals = useMemo(() => {
    let ideal = 0, actual = 0
    for (const sec of sections) {
      const t = sectionTotals(sec)
      ideal += t.ideal
      actual += t.actual
    }
    return { ideal, actual }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, idealLookup])

  function updateSection(idx, updated) {
    setSections(prev => prev.map((s, i) => i === idx ? updated : s))
  }

  function addSection() {
    setSections(prev => [...prev, emptySection()])
  }

  function removeSection(idx) {
    setSections(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit() {
    setValidationError(null)
    if (!submitterName.trim()) {
      setValidationError('Please enter your name.')
      return
    }
    const hasComplete = sections.some(sec =>
      sec.fixtures.some(r =>
        r.fixture_name && r.department && r.quantity !== '' && r.actual_options_per_fixture !== ''
      )
    )
    if (!hasComplete) {
      setValidationError('Please complete at least one fixture row (fixture, department, qty, and actual options).')
      return
    }

    setSubmitting(true)
    try {
      const { data: sub, error: subErr } = await supabase
        .from('option_count_submissions')
        .insert({ store_id: storeId, submitted_by: submitterName.trim() })
        .select()
        .single()
      if (subErr) throw subErr

      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i]

        // Upload photo first so the URL can go directly into the section INSERT
        let photoUrl = null
        if (sec.photo) {
          const ext = sec.photo.name.split('.').pop() || 'jpg'
          const path = `${sub.id}/section-${i + 1}.${ext}`
          const { error: uploadErr } = await supabase.storage
            .from('section-photos')
            .upload(path, sec.photo, { upsert: true })
          if (uploadErr) {
            console.error('Photo upload failed:', uploadErr.message)
          } else {
            const { data: urlData } = supabase.storage
              .from('section-photos')
              .getPublicUrl(path)
            photoUrl = urlData.publicUrl
          }
        }

        const { data: secData, error: secErr } = await supabase
          .from('submission_sections')
          .insert({
            submission_id: sub.id,
            section_number: i + 1,
            section_label: `Section ${i + 1}`,
            comment: sec.comment || null,
            photo_url: photoUrl,
          })
          .select()
          .single()
        if (secErr) throw secErr

        const fixtureRows = sec.fixtures
          .filter(r => r.fixture_name && r.department)
          .map(r => {
            const qty = parseFloat(r.quantity) || 0
            const actualPer = parseInt(r.actual_options_per_fixture) || 0
            const idealPer = getIdeal(r.fixture_name, r.department) || 0
            const productStory = r.product_story === 'Other'
              ? `Other: ${r.product_story_comment || ''}`.trim()
              : (r.product_story || null)
            return {
              section_id: secData.id,
              fixture_name: r.fixture_name,
              department: r.department,
              quantity: qty,
              actual_options_per_fixture: actualPer,
              ideal_options_per_fixture: idealPer,
              ideal_total: qty * idealPer,
              actual_total: qty * actualPer,
              product_story: productStory,
            }
          })

        if (fixtureRows.length > 0) {
          const { error: fxErr } = await supabase
            .from('submission_fixtures')
            .insert(fixtureRows)
          if (fxErr) throw fxErr
        }
      }

      const sectionSummaries = sections.map((sec, i) => {
        const t = sectionTotals(sec)
        return { label: `Section ${i + 1}`, ideal: t.ideal, actual: t.actual }
      })
      setSubmitResult({
        submittedBy: submitterName.trim(),
        sections: sectionSummaries,
        ideal: grandTotals.ideal,
        actual: grandTotals.actual,
      })
      setSubmitted(true)
    } catch (err) {
      setValidationError('Submission failed: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <p className="text-[#5a7180]">Loading…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-sm w-full text-center">
          <p className="text-red-700 mb-4">{loadError}</p>
          <button onClick={() => navigate('/')} className="text-[#2d5a6b] underline text-sm">
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (submitted && submitResult) {
    return <SuccessScreen result={submitResult} onHome={() => navigate('/')} />
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] pb-24">
      <header className="bg-[#1e3d4a] px-5 h-14 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <button
          onClick={() => navigate('/')}
          className="text-[#c8b89a] text-sm"
        >
          ← Stores
        </button>
        <h1 className="text-[#f5f0e8] font-semibold text-base truncate mx-3">{store.name}</h1>
        <div className="w-16" />
      </header>

      {store.layout_image_url || store.layout_image_url_2 ? (
        <div className="w-full bg-white border-b border-[#ede5d4]">
          {store.layout_image_url && (
            <>
              {store.layout_image_url_2 && (
                <p className="text-xs text-center text-[#5a7180] pt-2 font-medium">Floor 1</p>
              )}
              <img
                src={store.layout_image_url}
                alt={`${store.name} floor 1 layout`}
                className="w-full object-contain"
                style={{ maxHeight: 300 }}
              />
            </>
          )}
          {store.layout_image_url_2 && (
            <>
              <p className="text-xs text-center text-[#5a7180] pt-2 font-medium border-t border-[#ede5d4]">Floor 2</p>
              <img
                src={store.layout_image_url_2}
                alt={`${store.name} floor 2 layout`}
                className="w-full object-contain"
                style={{ maxHeight: 300 }}
              />
            </>
          )}
        </div>
      ) : (
        <div className="w-full h-28 bg-gray-100 flex items-center justify-center border-b border-gray-200">
          <span className="text-gray-400 text-sm">No layout image</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] p-4 mb-4">
          <label className="block text-sm font-medium text-[#1a2e35] mb-2">
            Your name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={submitterName}
            onChange={e => setSubmitterName(e.target.value)}
            placeholder="Enter your name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b]"
          />
        </div>

        {sections.map((sec, idx) => (
          <SectionPanel
            key={sec.id}
            section={sec}
            sectionNumber={idx + 1}
            fixtureNames={fixtureNames}
            getIdeal={getIdeal}
            getDeptsForFixture={getDeptsForFixture}
            onChange={updated => updateSection(idx, updated)}
            onRemove={sections.length > 1 ? () => removeSection(idx) : null}
          />
        ))}

        <button
          onClick={addSection}
          className="w-full border-2 border-dashed border-[#2d5a6b]/30 text-[#2d5a6b] py-3 rounded-2xl text-sm font-medium hover:border-[#2d5a6b]/60 hover:bg-[#2d5a6b]/5 transition-colors mb-4"
        >
          + Add Section
        </button>

        {validationError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            {validationError}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-[#2d5a6b] text-white py-3 rounded-2xl font-semibold text-base hover:bg-[#1e3d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-6"
        >
          {submitting ? 'Submitting…' : 'Submit Count'}
        </button>
      </div>

      <Totals ideal={grandTotals.ideal} actual={grandTotals.actual} />
    </div>
  )
}

function SuccessScreen({ result, onHome }) {
  const diff = result.actual - result.ideal
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="bg-[#1e3d4a] px-5 h-14 flex items-center shadow-lg">
        <h1 className="text-[#f5f0e8] font-semibold">Count Submitted</h1>
      </header>
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] p-5 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg flex-shrink-0">
              ✓
            </div>
            <div>
              <p className="font-semibold text-[#1a2e35]">Submitted successfully</p>
              <p className="text-sm text-[#5a7180]">by {result.submittedBy}</p>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[#5a7180] font-medium">Section</th>
                <th className="text-right py-2 text-[#5a7180] font-medium">Ideal</th>
                <th className="text-right py-2 text-[#5a7180] font-medium">Actual</th>
                <th className="text-right py-2 text-[#5a7180] font-medium">Diff</th>
              </tr>
            </thead>
            <tbody>
              {result.sections.map(sec => {
                const d = sec.actual - sec.ideal
                return (
                  <tr key={sec.label} className="border-b border-gray-50">
                    <td className="py-2 text-[#1a2e35]">{sec.label}</td>
                    <td className="py-2 text-right text-[#1a2e35]">{sec.ideal}</td>
                    <td className="py-2 text-right text-[#1a2e35]">{sec.actual}</td>
                    <td className={`py-2 text-right font-medium ${d >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {d > 0 ? '+' : ''}{d}
                    </td>
                  </tr>
                )
              })}
              <tr className="font-semibold border-t border-gray-200">
                <td className="pt-2 pb-1 text-[#1a2e35]">Total</td>
                <td className="pt-2 pb-1 text-right text-[#1a2e35]">{result.ideal}</td>
                <td className="pt-2 pb-1 text-right text-[#1a2e35]">{result.actual}</td>
                <td className={`pt-2 pb-1 text-right ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {diff > 0 ? '+' : ''}{diff}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={onHome}
          className="w-full bg-[#2d5a6b] text-white py-3 rounded-2xl font-semibold hover:bg-[#1e3d4a] transition-colors"
        >
          Back to Stores
        </button>
      </div>
    </div>
  )
}
