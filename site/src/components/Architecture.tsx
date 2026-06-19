import Reveal from './Reveal'
import { ArrowRightIcon } from './icons'

function Box({
  label,
  sub,
  accent = false,
}: {
  label: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-center ${
        accent
          ? 'border-accent/40 bg-accent-soft shadow-glow'
          : 'border-line bg-surface'
      }`}
    >
      <div className="text-sm font-semibold text-fg">{label}</div>
      {sub && (
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-fg-dim">
          {sub}
        </div>
      )}
    </div>
  )
}

function Arrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <div className="flex items-center justify-center text-fg-dim">
      <ArrowRightIcon className={vertical ? 'rotate-90' : ''} width={20} height={20} />
    </div>
  )
}

export default function Architecture() {
  return (
    <section id="architecture" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            A clean serverless pipeline
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            Two ways in — a schedule or a button — both flow through the same Step Functions
            workflow. State and credentials stay in managed AWS services.
          </p>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 rounded-2xl border border-line bg-surface-2/60 p-6 shadow-card sm:p-10">
          {/* Triggers */}
          <div className="mx-auto grid max-w-md grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <Box label="EventBridge" sub="every 5 min" />
            <div className="hidden text-center text-xs font-medium text-fg-dim sm:block">or</div>
            <div className="text-center text-xs font-medium text-fg-dim sm:hidden">or</div>
            <Box label="API Gateway" sub="Run now" />
          </div>

          <div className="my-2 flex justify-center">
            <Arrow vertical />
          </div>

          <div className="mx-auto max-w-xs">
            <Box label="Step Functions" sub="orchestrates the run" accent />
          </div>

          <div className="my-2 flex justify-center">
            <Arrow vertical />
          </div>

          {/* Workflow steps */}
          <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
            <Box label="pull-notion" sub="Lambda" />
            <Arrow />
            <Box label="transform-map" sub="Lambda" />
            <Arrow />
            <Box label="push-sheets" sub="Lambda" />
            <Arrow />
            <Box label="record-run" sub="Lambda" />
          </div>

          {/* Supporting services */}
          <div className="mt-8 grid gap-3 border-t border-dashed border-line pt-8 sm:grid-cols-3">
            <Box label="DynamoDB" sub="jobs & run state" />
            <Box label="Secrets Manager" sub="Notion & Google creds" />
            <Box label="mark-run-failed" sub="catches failures" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
