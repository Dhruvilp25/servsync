import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../lib/api'

type Run = {
  runId: string
  status: string
  stats?: { pulled?: number; pushed?: number; transformed?: number }
  startedAt?: string
  endedAt?: string
  executionArn?: string
  failure?: { error?: string; cause?: string }
}

function formatJobItem(item: Record<string, { S?: string }> | undefined): Record<string, unknown> {
  if (!item) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(item)) {
    if (v?.S) out[k] = k === 'source' || k === 'target' || k === 'mapping' ? JSON.parse(v.S) : v.S
  }
  return out
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const sec = Math.floor((now - d.getTime()) / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`
  return d.toLocaleDateString()
}

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState<Record<string, unknown> | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [runsRefreshing, setRunsRefreshing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const fetchRuns = useCallback(async () => {
    if (!id) return
    const res = await api.get(`/jobs/${id}/runs`)
    return (res.data || []) as Run[]
  }, [id])

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

  const refreshRuns = async () => {
    if (!id) return
    setRunsRefreshing(true)
    try {
      const list = await fetchRuns()
      setRuns(list ?? [])
    } finally {
      setRunsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!id || runs.length === 0) return
    const hasRunning = runs.some((r) => r.status === 'RUNNING')
    if (!hasRunning) return
    const interval = setInterval(() => refreshRuns(), 6000)
    return () => clearInterval(interval)
  }, [id, runs])

  const runNow = async () => {
    setRunning(true)
    try {
      await api.post(`/jobs/${id}/run`, { tenantId: 'jay' })
      const list = await fetchRuns()
      setRuns(list ?? [])
    } catch (e: any) {
      alert('Run failed: ' + (e?.response?.data?.message || e.message))
    } finally {
      setRunning(false)
    }
  }

  const lastRun = runs[0]

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

      {lastRun && (
        <section className="mb-6 p-4 rounded-lg border bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-600 mb-2">Last run</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              lastRun.status === 'RUNNING' ? 'bg-amber-100 text-amber-800' :
              lastRun.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {lastRun.status}
            </span>
            {lastRun.startedAt && (
              <span className="text-gray-600 text-sm">{relativeTime(lastRun.startedAt)}</span>
            )}
            {lastRun.stats && (
              <span className="text-gray-500 text-sm">
                pulled {lastRun.stats.pulled ?? '—'}, pushed {lastRun.stats.pushed ?? '—'}
              </span>
            )}
          </div>
          {lastRun.status === 'FAILED' && lastRun.failure && (
            <p className="mt-2 text-red-600 text-sm">
              {lastRun.failure.error ?? 'Unknown error'}
              {lastRun.failure.cause && ` — ${lastRun.failure.cause}`}
            </p>
          )}
        </section>
      )}

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Run history</h2>
          <button
            type="button"
            onClick={refreshRuns}
            disabled={runsRefreshing}
            className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {runsRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {runs.length === 0 ? (
          <p className="text-gray-600 text-sm">No runs yet. Use “Run now” or wait for the schedule.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((r) => (
              <li key={r.runId} className="border rounded p-3 flex flex-col gap-1 text-sm">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'RUNNING' ? 'bg-amber-100 text-amber-800' :
                      r.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {r.status}
                    </span>
                    {r.startedAt && (
                      <span className="text-gray-500" title={new Date(r.startedAt).toLocaleString()}>
                        {relativeTime(r.startedAt)}
                      </span>
                    )}
                    <span className="text-gray-400 font-mono text-xs">{r.runId}</span>
                  </div>
                  {r.stats && (
                    <span className="text-gray-600">
                      pulled {r.stats.pulled ?? '—'}, pushed {r.stats.pushed ?? '—'}
                    </span>
                  )}
                </div>
                {r.status === 'FAILED' && r.failure && (
                  <p className="text-red-600 text-xs mt-1">
                    {r.failure.error ?? 'Unknown error'}
                    {r.failure.cause && ` — ${r.failure.cause}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
