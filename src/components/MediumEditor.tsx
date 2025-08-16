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
import { useState, useCallback, useEffect } from 'react'

interface MediumEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function MediumEditor({ 
  content, 
  onChange, 
  placeholder = "Tell your story..." 
}: MediumEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 })
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')

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
          class: 'text-blue-600 underline hover:text-blue-800',
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
        // Get selection coordinates
        const coords = editor.view.coordsAtPos(from)
        setToolbarPosition({ 
          x: coords.left, 
          y: coords.top - 60 
        })
        setShowToolbar(true)
      }
      // Don't hide toolbar immediately - let user interact with it
    },
    editorProps: {
      attributes: {
        class: 'medium-editor-content',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        // Handle keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault()
              editor?.chain().focus().toggleBold().run()
              return true
            case 'i':
              event.preventDefault()
              editor?.chain().focus().toggleItalic().run()
              return true
            case 'k':
              event.preventDefault()
              setShowLinkInput(true)
              return true
          }
        }
        return false
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

  // Hide toolbar when clicking outside (with delay)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element
      // Don't hide if clicking on toolbar
      if (target.closest('.floating-toolbar')) {
        return
      }
      // Hide toolbar after delay to allow interaction
      setTimeout(() => {
        setShowToolbar(false)
      }, 100)
    }
    
    if (showToolbar) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showToolbar])

  if (!editor) {
    return null
  }

  return (
    <div className="relative w-full">
      {/* Floating Selection Toolbar */}
      {showToolbar && (
        <div
          className="floating-toolbar fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl flex items-center space-x-1 p-2"
          style={{
            left: Math.max(10, toolbarPosition.x - 100),
            top: Math.max(10, toolbarPosition.y),
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => setShowToolbar(true)}
        >
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-700' : ''
            }`}
            title="Bold (⌘B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-700' : ''
            }`}
            title="Italic (⌘I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-700' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('code') ? 'bg-gray-700' : ''
            }`}
            title="Code"
          >
            <Code className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('highlight') ? 'bg-gray-700' : ''
            }`}
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-700' : ''
            }`}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-700' : ''
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Lists */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-700' : ''
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-700' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-700 transition-colors ${
              editor.isActive('blockquote') ? 'bg-gray-700' : ''
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Link */}
          <button
            onClick={() => setShowLinkInput(true)}
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
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="medium-editor-container">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
