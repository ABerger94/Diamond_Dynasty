import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rulebookMarkdown from '../content/rulebook.md?raw'

export default function RulebookPage() {
  return (
    <>
      <div className="mb-6 flex justify-center">
        <img src="/logo-lockup.png" alt="Diamond Dynasty — Trading Card Game" className="w-full max-w-xs" />
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
