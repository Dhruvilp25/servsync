import { DOCS_URL, REPO_URL } from '../constants'
import { ArrowRightIcon, GitHubIcon } from './icons'
import Reveal from './Reveal'

function StatusDot({ tone }: { tone: 'ok' | 'run' }) {
  if (tone === 'run') {
    return (
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
      </span>
    )
  }
  return <span className="h-2 w-2 rounded-full bg-accent shadow-glow" />
}

function RunRow({
  job,
  time,
  status,
}: {
  job: string
  time: string
  status: 'Succeeded' | 'Running'
}) {
  const running = status === 'Running'
  return (
    <div className="flex items-center justify-between rounded-lg border border-line-soft bg-surface-2 px-3 py-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusDot tone={running ? 'run' : 'ok'} />
        <span className="truncate font-mono text-xs text-fg-muted">{job}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="hidden text-[11px] text-fg-dim sm:inline">{time}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            running
              ? 'bg-accent-soft text-accent'
              : 'bg-accent-soft text-accent'
          }`}
        >
          {status}
        </span>
      </div>
    </div>
  )
}

function FlowChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-line-soft bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-fg-muted">
      {label}
    </span>
  )
}

function StatusPanel() {
  return (
    <div className="relative rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
      {/* window header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot tone="ok" />
          <span className="text-sm font-medium text-fg">Recent runs</span>
        </div>
        <span className="rounded-full border border-line-soft px-2 py-0.5 text-[11px] text-fg-dim">
          every 5 min
        </span>
      </div>

      <div className="space-y-2">
        <RunRow job="notion-to-sheets-1" time="just now" status="Running" />
        <RunRow job="crm-leads-sync" time="3m ago" status="Succeeded" />
        <RunRow job="content-calendar" time="8m ago" status="Succeeded" />
      </div>

      {/* flow footer */}
      <div className="mt-4 flex items-center justify-center gap-2 border-t border-line-soft pt-4">
        <FlowChip label="Notion" />
        <ArrowRightIcon width={14} height={14} className="text-accent" />
        <FlowChip label="ServSync" />
        <ArrowRightIcon width={14} height={14} className="text-accent" />
        <FlowChip label="Sheets" />
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: copy */}
        <div>
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-fg-muted">
              <StatusDot tone="ok" />
              All systems operational
            </div>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-fg sm:text-6xl">
              Sync Notion to Google&nbsp;Sheets,
              <span className="text-accent"> on autopilot.</span>
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted">
              ServSync keeps your spreadsheets up to date with your Notion databases — on a
              schedule or on demand. Configure jobs in a small dashboard; the heavy lifting
              runs quietly on AWS.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg shadow-glow transition-transform hover:-translate-y-0.5"
              >
                <GitHubIcon width={18} height={18} />
                View on GitHub
              </a>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/60"
              >
                Read the docs
                <ArrowRightIcon width={16} height={16} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-6 text-xs text-fg-dim">
              Open source · Serverless on AWS · MIT licensed
            </p>
          </Reveal>
        </div>

        {/* Right: live status panel */}
        <Reveal delay={200}>
          <StatusPanel />
        </Reveal>
      </div>
    </section>
  )
}
