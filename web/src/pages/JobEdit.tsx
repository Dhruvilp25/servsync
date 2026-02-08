import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

function formatJobToForm(item: Record<string, { S?: string }> | undefined) {
  if (!item || Object.keys(item).length === 0) return null
  const source = item.source?.S ? JSON.parse(item.source.S) : {}
  const target = item.target?.S ? JSON.parse(item.target.S) : {}
  return {
    name: item.name?.S ?? '',
    notionDbId: source.dbId ?? '',
    sheetId: target.sheetId ?? '',
    range: target.range ?? 'Sheet1!A1:C',
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
        if (!cancelled && parsed) setForm(parsed)
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/jobs/${id}`, {
        tenantId: 'jay',
        name: form.name || id,
        source: { type: 'notion', dbId: form.notionDbId },
        target: { type: 'sheets', sheetId: form.sheetId, range: form.range },
        mapping: [
          { from: 'Name', to: 'A' },
          { from: 'Status', to: 'B' },
          { from: 'DueDate', to: 'C' },
        ],
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

        <div>
          <label className="block text-sm font-medium">Range</label>
          <input
            name="range"
            value={form.range}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
            placeholder="Sheet1!A1:C"
          />
          <p className="mt-1 text-xs text-gray-500">Use the tab name from the bottom of the sheet. If the tab has spaces, use quotes: &apos;To-do list&apos;!A1:C</p>
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
