import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

type Run = {
  runId: string
  status: string
  stats?: { pulled?: number; pushed?: number; transformed?: number }
  startedAt?: string
  endedAt?: string
  executionArn?: string
}

function formatJobItem(item: Record<string, { S?: string }> | undefined): Record<string, unknown> {
  if (!item) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(item)) {
    if (v?.S) out[k] = k === 'source' || k === 'target' || k === 'mapping' ? JSON.parse(v.S) : v.S
  }
  return out
}

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState<Record<string, unknown> | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [jobRes, runsRes] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get(`/jobs/${id}/runs`),
        ])
        if (!cancelled) {
          setJob(formatJobItem(jobRes.data))
          setRuns(runsRes.data || [])
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.response?.data?.message || e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [id])

  const runNow = async () => {
    setRunning(true)
    try {
      await api.post(`/jobs/${id}/run`, { tenantId: 'jay' })
      const runsRes = await api.get(`/jobs/${id}/runs`)
      setRuns(runsRes.data || [])
    } catch (e: any) {
      alert('Run failed: ' + (e?.response?.data?.message || e.message))
    } finally {
      setRunning(false)
    }
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <a className="inline-block mb-4 text-sm px-3 py-2 rounded border" href="/">← Back</a>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Job: {id}</h1>
        <div className="flex gap-2">
          <a
            href={`/jobs/${id}/edit`}
            className="text-sm px-3 py-2 rounded border"
          >
            Edit
          </a>
          <button
            onClick={runNow}
            disabled={running}
            className="text-sm px-3 py-2 rounded bg-black text-white disabled:opacity-60"
          >
            {running ? 'Starting…' : 'Run now'}
          </button>
        </div>
      </div>
      {err && <div className="mb-4 text-red-600">{err}</div>}

      {job && Object.keys(job).length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Config</h2>
          <dl className="bg-gray-50 p-3 rounded text-sm space-y-1">
            {job.name != null && <><dt className="font-medium text-gray-600">Name</dt><dd>{String(job.name)}</dd></>}
            {job.source != null && <><dt className="font-medium text-gray-600">Source</dt><dd className="font-mono">{JSON.stringify(job.source)}</dd></>}
            {job.target != null && <><dt className="font-medium text-gray-600">Target</dt><dd className="font-mono">{JSON.stringify(job.target)}</dd></>}
          </dl>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Run history</h2>
        {runs.length === 0 ? (
          <p className="text-gray-600 text-sm">No runs yet. Use “Run now” or wait for the schedule.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.runId} className="border rounded p-3 flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{r.runId}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs ${r.status === 'RUNNING' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                    {r.status}
                  </span>
                  {r.startedAt && <span className="ml-2 text-gray-500">{new Date(r.startedAt).toLocaleString()}</span>}
                </div>
                {r.stats && (
                  <span className="text-gray-600">
                    pulled: {r.stats.pulled ?? '—'}, pushed: {r.stats.pushed ?? '—'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
