import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rulebookMarkdown from '../content/rulebook.md?raw'

export default function RulebookPage() {
  return (
    <>
      {/* logo-mark.png is the text-free crest — the old logo-lockup.png baked "Diamond Dynasty"
          directly into the image pixels, so it can't just be relabeled; this reproduces the same
          icon-plus-wordmark layout with real text instead of illustrated artwork. */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <img src="/logo-mark.png" alt="" className="w-40" />
        <p className="text-2xl font-black uppercase tracking-wide text-amber-400">The LineUp</p>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">Trading Card Game</p>
      </div>
      <RulebookArticle />
    </>
  )
}

function RulebookArticle() {
  return (
    <article
      className="prose prose-invert prose-slate max-w-none
        prose-headings:text-slate-100 prose-a:text-sky-400 prose-strong:text-slate-100
        prose-table:text-sm prose-th:bg-slate-800 prose-td:border-slate-700 prose-th:border-slate-700
        prose-blockquote:border-sky-500 prose-blockquote:text-slate-400"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{rulebookMarkdown}</ReactMarkdown>
    </article>
  )
}
