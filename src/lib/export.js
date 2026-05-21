import ExcelJS from 'exceljs'
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
        comment: sec.comment || '',
        photo_url: sec.photo_url || null,
        fixtures: sec.submission_fixtures || [],
      })),
  }
}

function headerStyle(cell) {
  cell.font = { bold: true }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0F3' } }
}

async function buildWorkbook(sub) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'OptionCountTool'

  // Sheet 1: Summary
  const summary = wb.addWorksheet('Summary')
  summary.addRow(['Store', sub.store_name])
  summary.addRow(['Submitted By', sub.submitted_by])
  summary.addRow(['Date', new Date(sub.submitted_at).toLocaleDateString('en-GB')])
  summary.addRow([])

  const summaryHeader = summary.addRow(['Department', 'Ideal Total', 'Actual Total', 'Difference'])
  summaryHeader.eachCell(headerStyle)

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
    summary.addRow([dept, v.ideal, v.actual, v.actual - v.ideal])
  }
  summary.getColumn(1).width = 24
  summary.getColumn(2).width = 14
  summary.getColumn(3).width = 14
  summary.getColumn(4).width = 14

  // Sheet 2: Detail
  const detail = wb.addWorksheet('Detail')
  const detailHeader = detail.addRow([
    'Section', 'Fixture', 'Department', 'Qty',
    'Ideal/Fixture', 'Actual/Fixture', 'Ideal Total', 'Actual Total', 'Comment',
  ])
  detailHeader.eachCell(headerStyle)
  for (const sec of sub.sections) {
    for (const fx of sec.fixtures) {
      detail.addRow([
        sec.section_label,
        fx.fixture_name,
        fx.department,
        Number(fx.quantity),
        Number(fx.ideal_options_per_fixture),
        Number(fx.actual_options_per_fixture),
        Number(fx.ideal_total),
        Number(fx.actual_total),
        sec.comment || '',
      ])
    }
  }
  ;[20, 20, 16, 8, 14, 16, 12, 12, 30].forEach((w, i) => {
    detail.getColumn(i + 1).width = w
  })

  // Sheet 3: Photos — one row per section that has a photo
  const sectionsWithPhotos = sub.sections.filter(s => s.photo_url)
  if (sectionsWithPhotos.length > 0) {
    const photos = wb.addWorksheet('Photos')
    photos.getColumn(1).width = 22
    photos.getColumn(2).width = 52
    photos.getColumn(3).width = 32

    const photosHeader = photos.addRow(['Section', 'Photo', 'Comment'])
    photosHeader.eachCell(headerStyle)

    let rowIndex = 2
    for (const sec of sectionsWithPhotos) {
      photos.addRow([sec.section_label, '', sec.comment || ''])
      // Row height in points — 160pt ≈ 213px, enough for a clear photo
      photos.getRow(rowIndex).height = 160

      try {
        const res = await fetch(sec.photo_url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buf = await res.arrayBuffer()
        const imgId = wb.addImage({ buffer: buf, extension: detectExt(sec.photo_url) })
        // Anchor image to cell B(rowIndex) using tl/br — more reliable than ext
        photos.addImage(imgId, {
          tl: { col: 1, row: rowIndex - 1 },
          br: { col: 2, row: rowIndex },
        })
      } catch (err) {
        console.error('Photo export failed for', sec.section_label, err)
        photos.getRow(rowIndex).getCell(2).value = 'Photo unavailable'
      }

      rowIndex++
    }
  }

  return wb
}

function detectExt(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  if (ext === 'png') return 'png'
  if (ext === 'gif') return 'gif'
  return 'jpeg'
}

function filename(sub) {
  return `option-count-${sub.store_name.replace(/\s+/g, '-')}-${sub.id.slice(0, 8)}.xlsx`
}

export async function exportSingle(rawSub) {
  const sub = normalize(rawSub)
  const wb = await buildWorkbook(sub)
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename(sub)
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export async function exportBulk(rawSubs) {
  const zip = new JSZip()
  for (const rawSub of rawSubs) {
    const sub = normalize(rawSub)
    const wb = await buildWorkbook(sub)
    const buf = await wb.xlsx.writeBuffer()
    zip.file(filename(sub), buf)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'option-counts-export.zip'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
