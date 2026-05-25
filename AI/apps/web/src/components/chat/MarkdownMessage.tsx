import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Link } from 'react-router-dom'

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-sm prose-zinc max-w-none dark:prose-invert prose-p:my-2 prose-pre:my-2"
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const code = String(children).replace(/\n$/, '')
          if (match) {
            return (
              <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div">
                {code}
              </SyntaxHighlighter>
            )
          }
          return (
            <code className="rounded bg-zinc-100 px-1 py-0.5 text-sm dark:bg-zinc-800" {...props}>
              {children}
            </code>
          )
        },
        a({ href, children }) {
          if (href?.startsWith('doc:')) {
            const slug = href.replace('doc:', '')
            return <Link to={`/app/knowledge/${slug}`} className="text-indigo-500 hover:underline">{children}</Link>
          }
          return <a href={href}>{children}</a>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
