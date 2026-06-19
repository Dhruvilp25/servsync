import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { colLetter, fromMapping, toMapping } from '../lib/mapping'

function formatJobToForm(item: Record<string, { S?: string }> | undefined) {
  if (!item || Object.keys(item).length === 0) return null
  const source = item.source?.S ? JSON.parse(item.source.S) : {}
  const target = item.target?.S ? JSON.parse(item.target.S) : {}
  const mapping = item.mapping?.S ? JSON.parse(item.mapping.S) : []
  return {
    form: {
      name: item.name?.S ?? '',
      notionDbId: source.dbId ?? '',
      sheetId: target.sheetId ?? '',
      range: target.range ?? 'Sheet1!A1:C',
    },
    fields: fromMapping(mapping),
  }
}

export default function JobEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    notionDbId: '',
    sheetId: '',
    range: 'Sheet1!A1:C',
  })
  const [fields, setFields] = useState<string[]>(['Name', 'Status', 'Due'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await api.get(`/jobs/${id}`)
        const parsed = formatJobToForm(r.data)
        if (!cancelled && parsed) {
          setForm(parsed.form)
          if (parsed.fields.length) setFields(parsed.fields)
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

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
      await api.put(`/jobs/${id}`, {
        tenantId: 'jay',
        name: form.name || id,
        source: { type: 'notion', dbId: form.notionDbId },
        target: { type: 'sheets', sheetId: form.sheetId, range: form.range },
        mapping,
        nextDueAt: new Date().toISOString(),
      })
      navigate(`/jobs/${id}`)
    } catch (e: any) {
      alert('Failed to save: ' + (e?.response?.data?.message || e.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <a className="inline-block mb-4 text-sm px-3 py-2 rounded border" href={`/jobs/${id}`}>← Back</a>
      <h1 className="text-2xl font-bold mb-4">Edit Job: {id}</h1>
      {err && <div className="mb-4 text-red-600">{err}</div>}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name (optional)</label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
          />
        </div>

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
        </div>

        <div>
          <label className="block text-sm font-medium">Google Sheet ID</label>
          <input
            name="sheetId"
            value={form.sheetId}
            onChange={onChange}
            required
            className="mt-1 w-full border rounded p-2"
          />
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
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
