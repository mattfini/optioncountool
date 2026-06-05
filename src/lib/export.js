import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { supabase } from './supabase'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

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

function buildWorkbook(sub) {
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
    'Section', 'Fixture', 'Department', 'Product Story', 'Qty',
    'Ideal/Fixture', 'Actual/Fixture', 'Ideal Total', 'Actual Total', 'Comment',
  ])
  detailHeader.eachCell(headerStyle)
  for (const sec of sub.sections) {
    for (const fx of sec.fixtures) {
      detail.addRow([
        sec.section_label,
        fx.fixture_name,
        fx.department,
        fx.product_story || '',
        Number(fx.quantity),
        Number(fx.ideal_options_per_fixture),
        Number(fx.actual_options_per_fixture),
        Number(fx.ideal_total),
        Number(fx.actual_total),
        sec.comment || '',
      ])
    }
  }
  ;[20, 20, 16, 20, 8, 14, 16, 12, 12, 30].forEach((w, i) => {
    detail.getColumn(i + 1).width = w
  })

  return wb
}

function safe(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function detectExt(url) {
  const ext = url.split('?')[0].split('.').pop().toLowerCase()
  if (ext === 'png') return 'png'
  if (ext === 'gif') return 'gif'
  return 'jpg'
}

function storagePathFromUrl(url) {
  // Extract the object path after the bucket name from a Supabase public URL
  const marker = '/object/public/section-photos/'
  const idx = url.indexOf(marker)
  return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length).split('?')[0]) : null
}

async function fetchPhotos(sub) {
  const results = []
  for (const sec of sub.sections) {
    if (!sec.photo_url) {
      console.log(`fetchPhotos: no photo_url for "${sec.section_label}"`)
      continue
    }
    const storagePath = storagePathFromUrl(sec.photo_url)
    if (!storagePath) {
      console.warn(`fetchPhotos: could not parse storage path from URL: ${sec.photo_url}`)
      continue
    }
    console.log(`fetchPhotos: downloading "${storagePath}"`)
    const { data, error } = await supabase.storage.from('section-photos').download(storagePath)
    if (error || !data) {
      console.warn('Photo download failed:', sec.section_label, error?.message)
      continue
    }
    const ext = detectExt(sec.photo_url)
    results.push({
      name: `${safe(sub.store_name)}-${safe(sec.section_label)}.${ext}`,
      blob: data,
    })
  }
  return results
}

function triggerDownload(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function xlsxFilename(sub) {
  return `option-count-${safe(sub.store_name)}-${sub.id.slice(0, 8)}.xlsx`
}

export async function exportSingle(rawSub) {
  const sub = normalize(rawSub)
  const wb = buildWorkbook(sub)
  const buf = await wb.xlsx.writeBuffer()
  const photos = await fetchPhotos(sub)

  if (photos.length === 0) {
    triggerDownload(new Blob([buf], { type: XLSX_MIME }), xlsxFilename(sub))
  } else {
    const zip = new JSZip()
    zip.file(xlsxFilename(sub), buf)
    for (const { name, blob } of photos) zip.file(name, blob)
    const blob = await zip.generateAsync({ type: 'blob' })
    triggerDownload(blob, `option-count-${safe(sub.store_name)}-${sub.id.slice(0, 8)}.zip`)
  }
}

export async function exportBulk(rawSubs) {
  const zip = new JSZip()
  for (const rawSub of rawSubs) {
    const sub = normalize(rawSub)
    const wb = buildWorkbook(sub)
    const buf = await wb.xlsx.writeBuffer()
    zip.file(xlsxFilename(sub), buf)
    const photos = await fetchPhotos(sub)
    for (const { name, blob } of photos) zip.file(name, blob)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  triggerDownload(blob, 'option-counts-export.zip')
}
