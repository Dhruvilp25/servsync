import {
  BoltIcon,
  CloudIcon,
  ClockIcon,
  HistoryIcon,
  ShieldIcon,
  SlidersIcon,
} from './icons'
import Reveal from './Reveal'
import type { ComponentType, SVGProps } from 'react'

type Feature = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  title: string
  body: string
}

const features: Feature[] = [
  {
    icon: ClockIcon,
    title: 'Scheduled syncs',
    body: 'Jobs run automatically every 5 minutes when they’re due — powered by EventBridge schedules. Set it and forget it.',
  },
  {
    icon: BoltIcon,
    title: 'Run on demand',
    body: 'Need it now? Hit Run now from the dashboard and the sync kicks off immediately via Step Functions.',
  },
  {
    icon: HistoryIcon,
    title: 'Run history & status',
    body: 'Every run is recorded with its outcome — Succeeded, Failed, or Running — plus basic stats, so you always know what happened.',
  },
  {
    icon: CloudIcon,
    title: 'Serverless on AWS',
    body: 'Lambda, Step Functions, EventBridge and DynamoDB do the work. No servers to babysit, and it scales to zero when idle.',
  },
  {
    icon: ShieldIcon,
    title: 'Secrets stay in AWS',
    body: 'Your Notion token and Google service-account key live in AWS Secrets Manager — never in the dashboard or your code.',
  },
  {
    icon: SlidersIcon,
    title: 'Simple dashboard',
    body: 'A small React app to create, edit and run jobs. Point it at your database and sheet, set a range, and you’re live.',
  },
]

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
      <Reveal>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            Everything you need to keep data in sync
          </h2>
          <p className="mt-4 text-lg text-fg-muted">
            ServSync handles the scheduling, retries, and bookkeeping so your sheets just stay
            current.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 80}>
            <div className="group h-full rounded-xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-1 hover:border-accent/40">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-bg">
                <f.icon width={22} height={22} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
