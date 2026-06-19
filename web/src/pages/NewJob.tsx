import { useState } from 'react'
import { api } from '../lib/api'
import { colLetter, toMapping } from '../lib/mapping'

export default function NewJob() {
  const [form, setForm] = useState({
    tenantId: 'jay',
    jobId: '',
    name: '',
    notionDbId: '',
    sheetId: '',
    range: 'Sheet1!A1:C',
  })
  // Notion property names to sync, in column order (A, B, C, …).
  const [fields, setFields] = useState<string[]>(['Name', 'Status', 'Due'])
  const [saving, setSaving] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const setField = (i: number, value: string) =>
    setFields(fields.map((f, idx) => (idx === i ? value : f)))
  const addField = () => setFields([...fields, ''])
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const mapping = toMapping(fields)
    if (mapping.length === 0) {
      alert('Add at least one Notion property to sync.')
      return
    }
    setSaving(true)
    try {
      await api.post('/jobs', {
        tenantId: form.tenantId,
        jobId: form.jobId,
        name: form.name || form.jobId,
        source: { type: 'notion', dbId: form.notionDbId },
        target: { type: 'sheets', sheetId: form.sheetId, range: form.range },
        mapping,
        nextDueAt: new Date().toISOString(),
      })
      alert('✅ Job created successfully!')
      window.location.href = '/'
    } catch (e: any) {
      alert('❌ Failed: ' + (e?.response?.data?.message || e.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">New Job</h1>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Job ID</label>
          <input
            name="jobId"
            value={form.jobId}
            onChange={onChange}
            required
            className="mt-1 w-full border rounded p-2"
            placeholder="notion-to-sheets-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Name (optional)</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Notion Database ID</label>
            <input
              name="notionDbId"
              value={form.notionDbId}
              onChange={onChange}
              required
              className="mt-1 w-full border rounded p-2"
              placeholder="24dca244-8732-804a-b218-cfe3ba8aa071"
            />
            <p className="mt-1 text-xs text-gray-500">From the database URL. Share the database with your integration (⋮ → Connections).</p>
          </div>

          <div>
            <label className="block text-sm font-medium">Google Sheet ID</label>
            <input
              name="sheetId"
              value={form.sheetId}
              onChange={onChange}
              required
              className="mt-1 w-full border rounded p-2"
              placeholder="1UtbrI0kaPZoNJ4_ao4LMquhK2mnZM3EigaGkCqr_KXw"
            />
          </div>
        </div>

        {/* Field mapping: Notion property → spreadsheet column (by order) */}
        <div>
          <label className="block text-sm font-medium">Fields to sync</label>
          <p className="mt-1 mb-2 text-xs text-gray-500">
            Notion property names, in column order. They map to columns A, B, C… and become the
            sheet’s header row. Names must match your database exactly.
          </p>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-mono text-gray-500">{colLetter(i)}</span>
                <input
                  value={f}
                  onChange={(e) => setField(i, e.target.value)}
                  className="flex-1 border rounded p-2"
                  placeholder="Notion property name (e.g. Name)"
                />
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="px-2 py-2 text-sm text-gray-500 hover:text-red-600"
                  aria-label="Remove field"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addField}
            className="mt-2 text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            + Add field
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium">Range</label>
          <input
            name="range"
            value={form.range}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
            placeholder="Sheet1!A1:C"
          />
          <p className="mt-1 text-xs text-gray-500">Use the tab name from the bottom of the sheet. If the tab has spaces, use quotes: &apos;To-do list&apos;!A1:C. The sheet is overwritten each run (a mirror of your database).</p>
        </div>

        <button
          disabled={saving}
          className="px-4 py-2 rounded bg-black text-white"
        >
          {saving ? 'Saving…' : 'Create Job'}
        </button>
      </form>
    </div>
  )
}
