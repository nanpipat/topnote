'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Link } from '@tiptap/extension-link'
import { Highlight } from '@tiptap/extension-highlight'
import { useState } from 'react'
import { 
  Plus,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus
} from 'lucide-react'

interface BlockEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function BlockEditor({ content, onChange, placeholder = "Press '/' for commands or start writing..." }: BlockEditorProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
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
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onSelectionUpdate: ({ editor }) => {
      // Check if user typed '/' to show block menu
      const { from } = editor.state.selection
      const textBefore = editor.state.doc.textBetween(Math.max(0, from - 10), from, '\n')
      
      if (textBefore.endsWith('/')) {
        const coords = editor.view.coordsAtPos(from)
        setBlockMenuPosition({ x: coords.left, y: coords.bottom })
        setShowBlockMenu(true)
      } else {
        setShowBlockMenu(false)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none',
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === '/') {
          setTimeout(() => {
            const { from } = view.state.selection
            const coords = view.coordsAtPos(from)
            setBlockMenuPosition({ x: coords.left, y: coords.bottom + 20 })
            setShowBlockMenu(true)
          }, 0)
        }
        
        // Handle escape to close menu
        if (event.key === 'Escape') {
          setShowBlockMenu(false)
        }
        
        return false
      },
    },
    immediatelyRender: false,
  })

  if (!editor) {
    return null
  }

  const blockCommands = [
    {
      title: 'Text',
      description: 'Start writing with plain text',
      icon: Type,
      command: () => {
        editor.chain().focus().setParagraph().run()
        removeSlash()
      },
    },
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: Heading1,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        removeSlash()
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        removeSlash()
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3,
      command: () => {
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        removeSlash()
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bullet list',
      icon: List,
      command: () => {
        editor.chain().focus().toggleBulletList().run()
        removeSlash()
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: ListOrdered,
      command: () => {
        editor.chain().focus().toggleOrderedList().run()
        removeSlash()
      },
    },
    {
      title: 'To-do List',
      description: 'Track tasks with a to-do list',
      icon: CheckSquare,
      command: () => {
        editor.chain().focus().toggleTaskList().run()
        removeSlash()
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: Quote,
      command: () => {
        editor.chain().focus().toggleBlockquote().run()
        removeSlash()
      },
    },
    {
      title: 'Code',
      description: 'Capture a code snippet',
      icon: Code,
      command: () => {
        editor.chain().focus().toggleCodeBlock().run()
        removeSlash()
      },
    },
    {
      title: 'Divider',
      description: 'Visually divide blocks',
      icon: Minus,
      command: () => {
        editor.chain().focus().setHorizontalRule().run()
        removeSlash()
      },
    },
  ]

  const removeSlash = () => {
    const { from } = editor.state.selection
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 1), from, '\n')
    
    if (textBefore === '/') {
      editor.chain().focus().deleteRange({ from: from - 1, to: from }).run()
    }
    setShowBlockMenu(false)
  }

  const addBlock = () => {
    editor.chain().focus().createParagraphNear().run()
  }

  return (
    <div className="relative">
      {/* Add Block Button */}
      <div className="group relative">
        <button
          onClick={addBlock}
          className="absolute -left-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          title="Add block"
        >
          <Plus className="h-4 w-4 text-gray-400" />
        </button>
        
        {/* Editor Content */}
        <div className="min-h-[500px] py-8 px-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Block Command Menu */}
      {showBlockMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 w-80 max-h-80 overflow-y-auto"
          style={{
            left: blockMenuPosition.x,
            top: blockMenuPosition.y,
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
            Basic blocks
          </div>
          {blockCommands.map((command, index) => (
            <button
              key={index}
              onClick={command.command}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <command.icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {command.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {command.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Overlay to close menu */}
      {showBlockMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowBlockMenu(false)}
        />
      )}
    </div>
  )
}
