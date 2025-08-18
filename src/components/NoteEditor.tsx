'use client'

import { useState, useEffect, useCallback } from 'react'
import { Database } from '@/lib/supabase'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import NotionEditor from './NotionEditor'
import { ShareIcon, EyeIcon, EditIcon, CopyIcon, CheckIcon } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

type Note = Database['public']['Tables']['notes']['Row']

interface NoteEditorProps {
  note: Note
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void
  isMobile?: boolean
  onBack?: () => void
}

export default function NoteEditor({ note, onUpdateNote, isMobile = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  const [isPreview, setIsPreview] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)


  // Debounced save function
  const debouncedSave = useCallback(
    debounce((newTitle: string, newContent: string) => {
      if (newTitle !== note.title || newContent !== note.content) {
        onUpdateNote(note.id, { title: newTitle, content: newContent })
      }
    }, 1000),
    [note.id, note.title, note.content, onUpdateNote]
  )

  useEffect(() => {
    debouncedSave(title, content)
  }, [title, content, debouncedSave])

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content || '')
    if (note.share_token) {
      setShareUrl(`${window.location.origin}/share/${note.share_token}`)
    } else {
      setShareUrl(null)
    }
  }, [note])

  const handleShare = async () => {
    setIsSharing(true)
    try {
      let shareToken = note.share_token
      
      if (!shareToken) {
        shareToken = uuidv4()
        await onUpdateNote(note.id, { 
          is_public: true, 
          share_token: shareToken 
        })
      } else {
        await onUpdateNote(note.id, { is_public: !note.is_public })
      }
      
      if (!note.is_public) {
        setShareUrl(`${window.location.origin}/share/${shareToken}`)
      } else {
        setShareUrl(null)
      }
    } catch (error) {
      console.error('Error sharing note:', error)
    }
    setIsSharing(false)
  }

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl)
        } else {
          // Fallback for older browsers or non-secure contexts
          const textArea = document.createElement('textarea')
          textArea.value = shareUrl
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        // You could show a toast notification here
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header - Desktop only, mobile header is handled by parent */}
      {!isMobile && (
        <div className="border-b border-gray-200 p-4 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold text-gray-900 bg-transparent border-none outline-none flex-1 mr-4"
              placeholder="Untitled"
            />
            
            <div className="flex items-center space-x-2">
              {shareUrl && (
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                  <ShareIcon className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Shared</span>
                  <button
                    onClick={copyShareUrl}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Copy share link"
                  >
                    {copied ? (
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    ) : (
                      <CopyIcon className="h-3 w-3 text-green-600" />
                    )}
                  </button>
                </div>
              )}
              
              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                  note.is_public
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isSharing ? 'Processing...' : note.is_public ? 'Unshare' : 'Share'}
              </button>
              
              <button
                onClick={() => setIsPreview(!isPreview)}
                className={`p-2 rounded-md transition-colors ${
                  isPreview
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isPreview ? 'Edit mode' : 'Preview mode'}
              >
                {isPreview ? <EditIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Title Input */}
      {isMobile && (
        <div className="p-4 bg-white border-b border-gray-200">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none w-full"
            placeholder="Untitled"
          />
        </div>
      )}

      {/* Mobile Action Bar */}
      {isMobile && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            {shareUrl && (
              <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full">
                <ShareIcon className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700">Shared</span>
                <button
                  onClick={copyShareUrl}
                  className="p-0.5 hover:bg-green-100 rounded transition-colors"
                >
                  {copied ? (
                    <CheckIcon className="h-2.5 w-2.5 text-green-600" />
                  ) : (
                    <CopyIcon className="h-2.5 w-2.5 text-green-600" />
                  )}
                </button>
              </div>
            )}
            
            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                note.is_public
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isSharing ? '...' : note.is_public ? 'Unshare' : 'Share'}
            </button>
          </div>
          
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`p-2 rounded-md transition-colors ${
              isPreview
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {isPreview ? <EditIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {isPreview ? (
          <div className={`flex-1 overflow-y-auto bg-white ${
            isMobile ? 'p-4' : 'p-6'
          }`}>
            <div className={`mx-auto prose prose-gray ${
              isMobile ? 'prose-sm max-w-none' : 'prose-lg max-w-4xl'
            }`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3 mt-8">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-6">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className
                    return isInline ? (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                }}
              >
                {content || '*Start writing to see your content here...*'}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <NotionEditor
              content={content}
              onChange={setContent}
              placeholder="Type '/' for commands"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Debounce utility function
function debounce(
  func: (title: string, content: string) => void,
  wait: number
): (title: string, content: string) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (title: string, content: string) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(title, content), wait)
  }
}
