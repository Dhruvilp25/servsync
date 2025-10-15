import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Job = { tenantId: string; jobId: string }

export default function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [running, setRunning] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/jobs')
        setJobs(r.data)
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const runNow = async (jobId: string) => {
    setRunning(jobId)
    try {
      const res = await api.post(`/jobs/${jobId}/run`, { tenantId: 'jay' })
      alert('Started: ' + res.data.executionArn)
    } catch (e:any) {
      alert('Run failed: ' + (e?.response?.data?.message || e.message))
    } finally {
      setRunning(null)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <a className="text-sm px-3 py-2 rounded bg-black text-white" href="/new">New Job</a>
      </header>

      {err && <div className="mb-4 text-red-600">{err}</div>}

      {jobs.length === 0 ? (
        <div className="text-gray-600">No jobs yet. Create one → “New Job”.</div>
      ) : (
        <ul className="space-y-3">
          {jobs.map(j => (
            <li key={j.jobId} className="border rounded p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{j.jobId}</div>
                <div className="text-xs text-gray-500">tenant: {j.tenantId}</div>
              </div>
              <div className="flex gap-2">
                <a className="text-sm px-3 py-2 rounded border" href={`/jobs/${j.jobId}`}>Details</a>
                <button
                  onClick={() => runNow(j.jobId)}
                  disabled={running === j.jobId}
                  className="text-sm px-3 py-2 rounded bg-black text-white disabled:opacity-60"
                >
                  {running === j.jobId ? 'Starting…' : 'Run now'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
