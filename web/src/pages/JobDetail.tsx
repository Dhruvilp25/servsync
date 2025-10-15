import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

export default function JobDetail() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get(`/jobs/${id}`)
        setData(r.data)
      } catch (e:any) {
        setErr(e?.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <a className="inline-block mb-4 text-sm px-3 py-2 rounded border" href="/">← Back</a>
      <h1 className="text-2xl font-bold mb-4">Job: {id}</h1>
      {err && <div className="mb-4 text-red-600">{err}</div>}
      <pre className="bg-gray-50 p-3 rounded overflow-auto text-sm">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
