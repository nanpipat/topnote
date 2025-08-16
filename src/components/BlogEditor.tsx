'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { Link } from '@tiptap/extension-link'
import { Highlight } from '@tiptap/extension-highlight'
import { 
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Highlighter,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote
} from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'

interface BlogEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function BlogEditor({ 
  content, 
  onChange, 
  placeholder = "Tell your story..." 
}: BlogEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const toolbarRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          return placeholder
        },
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-green-600 underline hover:text-green-800 cursor-pointer',
        },
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: 'bg-yellow-200 px-1 rounded',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to
      
      if (hasSelection) {
        const text = editor.state.doc.textBetween(from, to, ' ')
        setSelectedText(text)
        setShowToolbar(true)
      } else {
        setShowToolbar(false)
      }
    },
    editorProps: {
      attributes: {
        class: 'blog-editor-content',
        spellcheck: 'false',
      },
    },
    immediatelyRender: false,
  })

  const setLink = useCallback(() => {
    if (!editor) return

    const url = linkUrl.trim()
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  // Keep toolbar visible when interacting with it
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && toolbarRef.current.contains(e.target as Node)) {
        e.preventDefault()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  if (!editor) {
    return null
  }

  const formatText = (format: string) => {
    switch (format) {
      case 'bold':
        editor.chain().focus().toggleBold().run()
        break
      case 'italic':
        editor.chain().focus().toggleItalic().run()
        break
      case 'strikethrough':
        editor.chain().focus().toggleStrike().run()
        break
      case 'code':
        editor.chain().focus().toggleCode().run()
        break
      case 'highlight':
        editor.chain().focus().toggleHighlight().run()
        break
      case 'h1':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'h2':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run()
        break
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run()
        break
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run()
        break
      case 'link':
        setShowLinkInput(true)
        break
    }
  }

  return (
    <div className="blog-editor-wrapper">
      {/* Fixed Toolbar - Always visible when text is selected */}
      {showToolbar && (
        <div 
          ref={toolbarRef}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white rounded-lg shadow-xl flex items-center space-x-1 p-2 transition-all duration-200"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            onClick={() => formatText('bold')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-700' : ''
            }`}
            title="Bold (⌘B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('italic')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-700' : ''
            }`}
            title="Italic (⌘I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('strikethrough')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-700' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('code')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('code') ? 'bg-gray-700' : ''
            }`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('highlight')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('highlight') ? 'bg-gray-700' : ''
            }`}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          <button
            onClick={() => formatText('h1')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('h2')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          <button
            onClick={() => formatText('bulletList')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-700' : ''
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('orderedList')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-700' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => formatText('blockquote')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('blockquote') ? 'bg-gray-700' : ''
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          <button
            onClick={() => formatText('link')}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('link') ? 'bg-gray-700' : ''
            }`}
            title="Link (⌘K)"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Link Input Modal */}
      {showLinkInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <input
              type="url"
              placeholder="Write your story..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink()
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false)
                  setLinkUrl('')
                }
              }}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowLinkInput(false)
                  setLinkUrl('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={setLink}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Editor Content */}
      <div ref={editorRef} className="blog-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
