import { DOCS_URL, REPO_URL, SETUP_URL } from '../constants'
import { ArrowRightIcon, GitHubIcon } from './icons'
import Reveal from './Reveal'

export default function Footer() {
  return (
    <footer className="border-t border-line">
      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-surface px-8 py-12 text-center shadow-glow sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(34,197,94,0.18),transparent_70%)]"
            />
            <h2 className="relative text-3xl font-bold tracking-tight text-fg sm:text-4xl">
              Stop exporting by hand.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-base text-fg-muted">
              Clone the repo, deploy the stack, and have your first Notion → Sheets sync
              running in minutes.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg shadow-glow transition-transform hover:-translate-y-0.5"
              >
                <GitHubIcon width={18} height={18} />
                Get the code
              </a>
              <a
                href={SETUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/60"
              >
                Setup guide
                <ArrowRightIcon width={16} height={16} />
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-fg-dim sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-bg">
              <svg width="13" height="13" viewBox="0 0 32 32" fill="none" aria-hidden>
                <path
                  d="M11 12.5a4.5 3 0 0 1 9 0M21 19.5a4.5 3 0 0 1-9 0"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="font-semibold text-fg">ServSync</span>
            <span className="text-fg-dim">· MIT licensed</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-fg">
              Docs
            </a>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="hover:text-fg">
              GitHub
            </a>
            <span className="text-fg-dim">Built with AWS · React</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
