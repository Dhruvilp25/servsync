import Reveal from './Reveal'

const steps = [
  {
    n: '01',
    title: 'Configure a job',
    body: 'In the dashboard, create a job: point it at a Notion database ID, a Google Sheet ID, and a range like Sheet1!A1:C. Share the database with your integration and the sheet with your service account.',
  },
  {
    n: '02',
    title: 'It runs on schedule',
    body: 'ServSync checks for due jobs every 5 minutes and runs them automatically — pulling from Notion, mapping the fields, and pushing rows to your sheet. Or trigger a run yourself any time.',
  },
  {
    n: '03',
    title: 'Rows land in your sheet',
    body: 'Your Google Sheet stays current with no manual exports. Check Run history on the job page to confirm each sync succeeded.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-line bg-surface-2/40">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Up and running in three steps
            </h2>
            <p className="mt-4 text-lg text-fg-muted">
              No glue code to maintain. Configure once, and ServSync keeps it flowing.
            </p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100}>
              <div className="relative h-full rounded-xl border border-line bg-surface p-6 shadow-card">
                <div className="font-mono text-sm font-bold tracking-widest text-accent">
                  {s.n}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
