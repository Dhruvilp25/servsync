import Reveal from './Reveal'

const stats = [
  { value: '5 min', label: 'Sync interval' },
  { value: '7', label: 'AWS Lambdas' },
  { value: '$0', label: 'Idle cost — scales to zero' },
  { value: '100%', label: 'Serverless' },
]

export default function Metrics() {
  return (
    <section className="border-y border-line bg-surface-2/50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-6 py-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 80}>
            <div className="px-4 py-8 text-center">
              <div className="text-3xl font-extrabold tracking-tight text-fg sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-fg-dim">
                {s.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
