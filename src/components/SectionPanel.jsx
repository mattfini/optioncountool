import FixtureRow from './FixtureRow'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function emptyRow() {
  return { id: uid(), fixture_name: '', department: '', quantity: '', actual_options_per_fixture: '' }
}

export default function SectionPanel({ section, sectionNumber, fixtureNames, getIdeal, getDeptsForFixture, onChange, onRemove }) {
  function updateRow(rowId, updated) {
    onChange({ ...section, fixtures: section.fixtures.map(r => r.id === rowId ? updated : r) })
  }

  function removeRow(rowId) {
    onChange({ ...section, fixtures: section.fixtures.filter(r => r.id !== rowId) })
  }

  function addRow() {
    onChange({ ...section, fixtures: [...section.fixtures, emptyRow()] })
  }

  let idealTotal = 0
  let actualTotal = 0
  for (const row of section.fixtures) {
    const qty = parseFloat(row.quantity) || 0
    const actualPer = parseInt(row.actual_options_per_fixture) || 0
    const idealPer = (row.fixture_name && row.department)
      ? (getIdeal(row.fixture_name, row.department) || 0)
      : 0
    idealTotal += qty * idealPer
    actualTotal += qty * actualPer
  }
  const diff = actualTotal - idealTotal

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#ede5d4] mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e3d4a]/5 border-b border-[#ede5d4]">
        <h3 className="font-semibold text-[#1a2e35] text-base">Section {sectionNumber}</h3>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
          >
            Remove section
          </button>
        )}
      </div>

      <div className="p-3">
        {section.fixtures.map(row => (
          <FixtureRow
            key={row.id}
            row={row}
            fixtureNames={fixtureNames}
            getIdeal={getIdeal}
            getDeptsForFixture={getDeptsForFixture}
            onChange={updated => updateRow(row.id, updated)}
            onRemove={section.fixtures.length > 1 ? () => removeRow(row.id) : null}
          />
        ))}
        <button
          onClick={addRow}
          className="w-full border border-dashed border-[#2d5a6b]/30 text-[#2d5a6b] py-2 rounded-xl text-sm font-medium hover:border-[#2d5a6b]/60 hover:bg-[#2d5a6b]/5 transition-colors mt-1"
        >
          + Add fixture row
        </button>
      </div>

      <div className="px-3 pb-3">
        <label className="block text-xs text-[#5a7180] font-medium mb-1">
          Section comment
        </label>
        <textarea
          value={section.comment || ''}
          onChange={e => onChange({ ...section, comment: e.target.value })}
          placeholder="Any notes for this section…"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b] resize-none"
        />
      </div>

      <div className="flex justify-end gap-6 px-4 py-3 bg-[#f5f0e8] border-t border-[#ede5d4]">
        <div className="text-center">
          <div className="text-xs text-[#5a7180] mb-0.5">Section Ideal</div>
          <div className="font-semibold text-[#1a2e35] text-sm">{idealTotal}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#5a7180] mb-0.5">Section Actual</div>
          <div className="font-semibold text-[#1a2e35] text-sm">{actualTotal}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-[#5a7180] mb-0.5">Diff</div>
          <div className={`font-semibold text-sm ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {diff >= 0 && diff > 0 ? '+' : ''}{diff}
          </div>
        </div>
      </div>
    </div>
  )
}
