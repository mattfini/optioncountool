import SearchableSelect from './SearchableSelect'

const PRODUCT_STORY_OPTIONS = ['Product Story 1', 'Product Story 2', 'Cold water', 'Other', 'NA']

export default function FixtureRow({ row, fixtureNames, getIdeal, getDeptsForFixture, onChange, onRemove }) {
  const depts = row.fixture_name ? getDeptsForFixture(row.fixture_name) : []
  const idealVal = row.fixture_name && row.department
    ? getIdeal(row.fixture_name, row.department)
    : null

  const qty = parseFloat(row.quantity) || 0
  const actualPer = parseInt(row.actual_options_per_fixture) || 0
  const idealPer = idealVal !== null ? Number(idealVal) : 0
  const idealTotal = qty * idealPer
  const actualTotal = qty * actualPer

  function handleFixtureChange(name) {
    const newDepts = name ? getDeptsForFixture(name) : []
    const dept = newDepts.length === 1
      ? newDepts[0]
      : (newDepts.includes(row.department) ? row.department : '')
    onChange({ ...row, fixture_name: name, department: dept })
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 mb-2 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-[#5a7180] font-medium uppercase tracking-wide">Fixture</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-red-400 hover:text-red-600 text-xs w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-2">
        <SearchableSelect
          options={fixtureNames}
          value={row.fixture_name}
          onChange={handleFixtureChange}
          placeholder="Search fixture…"
        />
      </div>

      <div className="mb-2">
        <select
          value={row.department}
          onChange={e => onChange({ ...row, department: e.target.value })}
          disabled={!row.fixture_name || depts.length === 0}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a6b] disabled:bg-gray-50 disabled:text-gray-400"
        >
          <option value="">Department…</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="mb-3">
        <select
          value={row.product_story || ''}
          onChange={e => onChange({ ...row, product_story: e.target.value, product_story_comment: '' })}
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2d5a6b]"
        >
          <option value="">Product Story…</option>
          {PRODUCT_STORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {row.product_story === 'Other' && (
          <input
            type="text"
            value={row.product_story_comment || ''}
            onChange={e => onChange({ ...row, product_story_comment: e.target.value })}
            placeholder="Please describe…"
            className="w-full mt-1.5 border border-[#2d5a6b]/40 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b]"
          />
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs text-[#5a7180] mb-1">No. of selected fixture in section</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={row.quantity}
            onChange={e => onChange({ ...row, quantity: e.target.value })}
            placeholder="0"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b]"
          />
        </div>
        <div>
          <label className="block text-xs text-[#5a7180] mb-1">Actual no. of options per fixture</label>
          <input
            type="number"
            min="0"
            step="1"
            value={row.actual_options_per_fixture}
            onChange={e => onChange({ ...row, actual_options_per_fixture: e.target.value })}
            placeholder="0"
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d5a6b]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[#f5f0e8] rounded-lg p-2 text-xs">
        <div>
          <div className="text-[#5a7180] mb-0.5">Ideal/fixture</div>
          <div className="font-semibold text-[#1a2e35]">
            {idealVal !== null ? idealVal : '—'}
          </div>
        </div>
        <div>
          <div className="text-[#5a7180] mb-0.5">Ideal total</div>
          <div className="font-semibold text-[#1a2e35]">
            {idealVal !== null ? idealTotal : '—'}
          </div>
        </div>
        <div>
          <div className="text-[#5a7180] mb-0.5">Actual total</div>
          <div className="font-semibold text-[#1a2e35]">{actualTotal}</div>
        </div>
      </div>
    </div>
  )
}
