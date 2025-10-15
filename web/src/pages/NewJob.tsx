import { useState } from 'react'
import { api } from '../lib/api'

export default function NewJob() {
  const [form, setForm] = useState({
    tenantId: 'jay',
    jobId: '',
    name: '',
    notionDbId: '',
    sheetId: '',
    range: 'Sheet1!A:C'
  })
  const [saving, setSaving] = useState(false)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/jobs', {
        tenantId: form.tenantId,
        jobId: form.jobId,
        name: form.name || form.jobId,
        source: { type: 'notion', dbId: form.notionDbId },
        target: { type: 'sheets', sheetId: form.sheetId, range: form.range },
        mapping: [
          { from: 'Name', to: 'A' },
          { from: 'Status', to: 'B' },
          { from: 'DueDate', to: 'C' },
        ],
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
              placeholder="24dca2448732804ab218cfe3ba8aa071"
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
              placeholder="1UtbrI0kaPZoNJ4_ao4LMquhK2mnZM3EigaGkCqr_KXw"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Range</label>
          <input
            name="range"
            value={form.range}
            onChange={onChange}
            className="mt-1 w-full border rounded p-2"
            placeholder="Sheet1!A:C"
          />
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
