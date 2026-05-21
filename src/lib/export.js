import * as XLSX from 'xlsx'
import JSZip from 'jszip'

function normalize(sub) {
  return {
    id: sub.id,
    store_name: sub.stores?.name || 'Unknown',
    submitted_by: sub.submitted_by,
    submitted_at: sub.submitted_at,
    sections: [...(sub.submission_sections || [])]
      .sort((a, b) => a.section_number - b.section_number)
      .map(sec => ({
        section_label: sec.section_label,
        fixtures: sec.submission_fixtures || [],
      })),
  }
}

function buildWorkbook(sub) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summaryRows = [
    ['Store', sub.store_name],
    ['Submitted By', sub.submitted_by],
    ['Date', new Date(sub.submitted_at).toLocaleDateString('en-GB')],
    [],
    ['Department', 'Ideal Total', 'Actual Total', 'Difference'],
  ]
  const byDept = {}
  for (const sec of sub.sections) {
    for (const fx of sec.fixtures) {
      const d = fx.department || 'Unknown'
      if (!byDept[d]) byDept[d] = { ideal: 0, actual: 0 }
      byDept[d].ideal += Number(fx.ideal_total) || 0
      byDept[d].actual += Number(fx.actual_total) || 0
    }
  }
  for (const [dept, v] of Object.entries(byDept)) {
    summaryRows.push([dept, v.ideal, v.actual, v.actual - v.ideal])
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary')

  // Sheet 2: Detail
  const detailRows = [
    ['Section', 'Fixture', 'Department', 'Qty', 'Ideal/Fixture', 'Actual/Fixture', 'Ideal Total', 'Actual Total'],
  ]
  for (const sec of sub.sections) {
    for (const fx of sec.fixtures) {
      detailRows.push([
        sec.section_label,
        fx.fixture_name,
        fx.department,
        Number(fx.quantity),
        Number(fx.ideal_options_per_fixture),
        Number(fx.actual_options_per_fixture),
        Number(fx.ideal_total),
        Number(fx.actual_total),
      ])
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailRows), 'Detail')

  return wb
}

export function exportSingle(rawSub) {
  const sub = normalize(rawSub)
  const wb = buildWorkbook(sub)
  XLSX.writeFile(wb, `option-count-${sub.store_name.replace(/\s+/g, '-')}-${sub.id.slice(0, 8)}.xlsx`)
}

export async function exportBulk(rawSubs) {
  const zip = new JSZip()
  for (const rawSub of rawSubs) {
    const sub = normalize(rawSub)
    const wb = buildWorkbook(sub)
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    zip.file(`option-count-${sub.store_name.replace(/\s+/g, '-')}-${sub.id.slice(0, 8)}.xlsx`, buf)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'option-counts-export.zip'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
