'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

import { 
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Terminal,
  Minus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Plus,
  GripVertical,
  Bold,
  Italic,
  Strikethrough,
  Link2,
  Highlighter,
  MoreHorizontal,
  Palette,
  Table as TableIcon,
  Image as ImageIcon,
  AlertCircle,
  ChevronRight,
  FileText,
  Calendar,
  Hash,
} from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'

interface NotionEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

interface BlockMenuItem {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  command: () => void
  keywords: string[]
}

export default function NotionEditor({ 
  content, 
  onChange, 
  placeholder = "Type '/' for commands" 
}: NotionEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
  const [slashQuery, setSlashQuery] = useState('')
  const [showBlockMenu, setShowBlockMenu] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 })
  const [hoveredBlock, setHoveredBlock] = useState<HTMLElement | null>(null)
  const [showSelectionToolbar, setShowSelectionToolbar] = useState(false)
  const [selectionToolbarPos, setSelectionToolbarPos] = useState({ x: 0, y: 0 })
  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  // Create lowlight instance
  const lowlight = createLowlight()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: false, // Disable default to use custom
        orderedList: false, // Disable default to use custom
        listItem: false, // Disable default to use custom
        codeBlock: false, // Disable default to use CodeBlockLowlight
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: 'my-bullet-list',
        },
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
        HTMLAttributes: {
          class: 'my-ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'my-list-item',
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
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
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
    onCreate: ({ editor }) => {
      editor.commands.focus()
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        updateSelectionToolbarPosition()
        setShowSelectionToolbar(true)
      } else {
        setShowSelectionToolbar(false)
      }
      // Get current node and position within that node
      const $pos = editor.state.doc.resolve(from)
      const currentNode = $pos.parent
      const nodeStart = $pos.start($pos.depth)
      const textInCurrentNode = currentNode.textContent || ''
      const posInNode = from - nodeStart
      const textBeforeInNode = textInCurrentNode.slice(0, posInNode)
      
      if (textBeforeInNode.endsWith('/')) {
        const coords = editor.view.coordsAtPos(from)
        setSlashMenuPosition({ x: coords.left, y: coords.bottom + 5 })
        setShowSlashMenu(true)
        setSlashQuery('')
      } else if (textBeforeInNode.match(/\/\w*$/)) {
        const match = textBeforeInNode.match(/\/(\w*)$/)
        if (match) {
          setSlashQuery(match[1])
        }
      } else {
        setShowSlashMenu(false)
        setSlashQuery('')
      }
    },
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
        spellcheck: 'false',
      },
      handleKeyDown: (view, event) => {
        // Handle escape to close menus
        if (event.key === 'Escape') {
          setShowSlashMenu(false)
          setShowBlockMenu(false)
          return true
        }
        
        // Handle enter in slash menu
        if (showSlashMenu && event.key === 'Enter') {
          const filteredItems = getFilteredSlashItems()
          if (filteredItems.length > 0) {
            filteredItems[0].command()
            return true
          }
        }
        
        return false
      },
    },
    immediatelyRender: false,
  })

  const removeSlashCommand = useCallback(() => {
    if (!editor) return
    
    const { from } = editor.state.selection
    const $pos = editor.state.doc.resolve(from)
    const currentNode = $pos.parent
    const nodeStart = $pos.start($pos.depth)
    const textInCurrentNode = currentNode.textContent || ''
    const posInNode = from - nodeStart
    const textBeforeInNode = textInCurrentNode.slice(0, posInNode)
    
    const slashIndex = textBeforeInNode.lastIndexOf('/')
    
    if (slashIndex !== -1) {
      const actualSlashPos = nodeStart + slashIndex
      editor.chain()
        .focus()
        .deleteRange({ from: actualSlashPos, to: from })
        .run()
    }
    
    setShowSlashMenu(false)
    setSlashQuery('')
  }, [editor])

  const slashMenuItems: BlockMenuItem[] = [
    {
      icon: Type,
      title: 'Text',
      description: 'Just start writing with plain text.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().setParagraph().run()
      },
      keywords: ['text', 'paragraph', 'p']
    },
    {
      icon: Heading1,
      title: 'Heading 1',
      description: 'Big section heading.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleHeading({ level: 1 }).run()
      },
      keywords: ['heading', 'h1', 'title']
    },
    {
      icon: Heading2,
      title: 'Heading 2',
      description: 'Medium section heading.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleHeading({ level: 2 }).run()
      },
      keywords: ['heading', 'h2', 'subtitle']
    },
    {
      icon: Heading3,
      title: 'Heading 3',
      description: 'Small section heading.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleHeading({ level: 3 }).run()
      },
      keywords: ['heading', 'h3']
    },
    {
      icon: List,
      title: 'Bulleted list',
      description: 'Create a simple bulleted list.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleBulletList().run()
      },
      keywords: ['bullet', 'list', 'ul']
    },
    {
      icon: ListOrdered,
      title: 'Numbered list',
      description: 'Create a list with numbering.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleOrderedList().run()
      },
      keywords: ['numbered', 'list', 'ol', 'ordered']
    },
    {
      icon: Quote,
      title: 'Quote',
      description: 'Capture a quote.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleBlockquote().run()
      },
      keywords: ['quote', 'blockquote', 'citation']
    },
    {
      icon: Code,
      title: 'Code',
      description: 'Capture a code snippet.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().toggleCodeBlock().run()
      },
      keywords: ['code', 'codeblock', 'snippet']
    },
    {
      icon: Minus,
      title: 'Divider',
      description: 'Visually divide blocks.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().setHorizontalRule().run()
      },
      keywords: ['divider', 'separator', 'hr', 'line']
    },
    {
      icon: TableIcon,
      title: 'Table',
      description: 'Create a simple table.',
      command: () => {
        removeSlashCommand()
        const tableHTML = `
<table style="border-collapse: collapse; width: 100%; margin: 1em 0;">
  <thead>
    <tr>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 1</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 2</th>
      <th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5;">Header 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
      <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
    </tr>
  </tbody>
</table>
`
        editor?.chain().focus().insertContent(tableHTML).run()
      },
      keywords: ['table', 'grid', 'data']
    },
    {
      icon: ImageIcon,
      title: 'Image',
      description: 'Insert an image.',
      command: () => {
        removeSlashCommand()
        const url = window.prompt('Enter image URL:')
        if (url) {
          const imageHTML = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;" />`
          editor?.chain().focus().insertContent(imageHTML).run()
        }
      },
      keywords: ['image', 'photo', 'picture', 'img']
    },
    {
      icon: AlertCircle,
      title: 'Callout',
      description: 'Make writing stand out.',
      command: () => {
        removeSlashCommand()
        const calloutHTML = `
<div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 1em 0; border-radius: 4px;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
    <span style="color: #0ea5e9; font-weight: 600;">💡 Note</span>
  </div>
  <div>Type your note here...</div>
</div>
`
        editor?.chain().focus().insertContent(calloutHTML).run()
      },
      keywords: ['callout', 'note', 'info', 'warning']
    },
    {
      icon: ChevronRight,
      title: 'Toggle',
      description: 'Create a collapsible section.',
      command: () => {
        removeSlashCommand()
        const toggleHTML = `
<details style="margin: 1em 0; border: 1px solid #e5e7eb; border-radius: 6px; padding: 0;">
  <summary style="padding: 12px 16px; cursor: pointer; font-weight: 500; background-color: #f9fafb; border-radius: 6px 6px 0 0;">Toggle to expand</summary>
  <div style="padding: 16px;">Content goes here...</div>
</details>
`
        editor?.chain().focus().insertContent(toggleHTML).run()
      },
      keywords: ['toggle', 'collapse', 'expand', 'details']
    },
    {
      icon: FileText,
      title: 'Page',
      description: 'Create a sub-page.',
      command: () => {
        removeSlashCommand()
        editor?.chain().focus().insertContent('📄 New Page').run()
      },
      keywords: ['page', 'subpage', 'document']
    },
    {
      icon: Calendar,
      title: 'Date',
      description: 'Insert today\'s date.',
      command: () => {
        removeSlashCommand()
        const today = new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
        editor?.chain().focus().insertContent(today).run()
      },
      keywords: ['date', 'today', 'time', 'calendar']
    },
    {
      icon: Terminal,
      title: 'Terminal',
      description: 'Create a terminal/command line block.',
      command: () => {
        removeSlashCommand()
        const terminalHTML = `
<div style="background-color: #1e1e1e; border-radius: 6px; margin: 1em 0; overflow: hidden; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;">
  <div style="background-color: #2d2d2d; padding: 8px 12px; border-bottom: 1px solid #404040; font-size: 12px; color: #cccccc; display: flex; align-items: center; gap: 6px;">
    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ff5f56;"></div>
    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #ffbd2e;"></div>
    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: #27ca3f;"></div>
    <span style="margin-left: 8px;">Terminal</span>
  </div>
  <pre style="margin: 0; padding: 16px; background: transparent; font-size: 14px; line-height: 1.45; color: #e6e6e6;"><code><span style="color: #4ec9b0;">$</span> <span style="color: #dcdcaa;">npm</span> <span style="color: #ce9178;">install</span>
<span style="color: #4ec9b0;">$</span> <span style="color: #dcdcaa;">npm</span> <span style="color: #ce9178;">run</span> <span style="color: #ce9178;">dev</span></code></pre>
</div>
`
        editor?.chain().focus().insertContent(terminalHTML).run()
      },
      keywords: ['terminal', 'command', 'shell', 'bash', 'cmd']
    },
    {
      icon: Hash,
      title: 'Math',
      description: 'Write mathematical expressions.',
      command: () => {
        removeSlashCommand()
        const mathHTML = `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 1em 0; font-family: 'Courier New', monospace; text-align: center; font-size: 18px;">E = mc²</div>`
        editor?.chain().focus().insertContent(mathHTML).run()
      },
      keywords: ['math', 'equation', 'formula', 'latex']
    }
  ]

  const updateSelectionToolbarPosition = useCallback(() => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    if (from === to) return
    
    const start = editor.view.coordsAtPos(from)
    const end = editor.view.coordsAtPos(to)
    
    const x = (start.left + end.left) / 2
    const y = start.top - 50 // Position above selection
    
    setSelectionToolbarPos({ x, y })
  }, [editor])

  const getFilteredSlashItems = useCallback(() => {
    if (!slashQuery) return slashMenuItems
    
    return slashMenuItems.filter(item => 
      item.title.toLowerCase().includes(slashQuery.toLowerCase()) ||
      item.keywords.some(keyword => keyword.includes(slashQuery.toLowerCase()))
    )
  }, [slashQuery, slashMenuItems])

  const addBlock = useCallback(() => {
    if (!editor) return
    editor.chain().focus().createParagraphNear().run()
  }, [editor])

  // Handle block hover effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!editorRef.current) return
      
      const target = e.target as HTMLElement
      const blockElement = target.closest('p, h1, h2, h3, ul, ol, blockquote, pre, hr')
      
      if (blockElement && editorRef.current.contains(blockElement)) {
        setHoveredBlock(blockElement as HTMLElement)
      } else {
        setHoveredBlock(null)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Handle selection toolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      if (!editor) return

      const { selection } = editor.state
      const { from, to } = selection

      // Only show toolbar if there's a text selection (not just cursor)
      if (from !== to && !selection.empty) {
        const { view } = editor
        const start = view.coordsAtPos(from)
        const end = view.coordsAtPos(to)
        
        // Calculate toolbar position (fixed positioning relative to viewport)
        const x = Math.min(start.left, end.left) + (Math.abs(end.left - start.left) / 2)
        const y = Math.min(start.top, end.top) - 50
        
        setSelectionToolbarPos({ x, y })
        setShowSelectionToolbar(true)
      } else {
        setShowSelectionToolbar(false)
        setShowMoreOptions(false) // Close more options when selection changes
      }
    }

    if (editor) {
      editor.on('selectionUpdate', handleSelectionChange)
      return () => {
        editor.off('selectionUpdate', handleSelectionChange)
      }
    }
  }, [editor])

  // Close more options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreOptions) {
        const target = event.target as HTMLElement
        if (!target.closest('.relative')) {
          setShowMoreOptions(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreOptions])

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [editor, content])

  if (!editor) {
    return null
  }

  return (
    <div className="notion-editor-wrapper">
      {/* Slash Command Menu */}
      {showSlashMenu && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 w-80 max-h-80 overflow-y-auto"
          style={{
            left: slashMenuPosition.x,
            top: slashMenuPosition.y,
          }}
        >
          <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
            Basic blocks
          </div>
          {getFilteredSlashItems().map((item, index) => (
            <button
              key={index}
              onClick={item.command}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 transition-colors"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <item.icon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {item.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Block Hover Toolbar */}
      {hoveredBlock && (
        <div
          className="absolute left-0 flex items-center space-x-1 opacity-0 hover:opacity-100 transition-opacity z-40"
          style={{
            top: hoveredBlock.offsetTop,
            marginLeft: '-60px',
          }}
        >
          <button
            onClick={addBlock}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
            title="Add block"
          >
            <Plus className="h-3 w-3 text-gray-600" />
          </button>
          <button
            onClick={() => {
              const rect = hoveredBlock.getBoundingClientRect()
              setBlockMenuPosition({ x: rect.left - 200, y: rect.top })
              setShowBlockMenu(true)
            }}
            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center transition-colors"
            title="Block menu"
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selection Toolbar */}
      {showSelectionToolbar && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex items-center gap-1"
          style={{
            left: selectionToolbarPos.x - 100, // Center the toolbar
            top: selectionToolbarPos.y,
          }}
        >
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('bold') ? 'bg-gray-100' : ''
            }`}
            title="Bold (⌘B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('italic') ? 'bg-gray-100' : ''
            }`}
            title="Italic (⌘I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('strike') ? 'bg-gray-100' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('code') ? 'bg-gray-100' : ''
            }`}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor?.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('highlight') ? 'bg-gray-100' : ''
            }`}
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => {
              const url = window.prompt('Enter URL:')
              if (url) {
                editor?.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`p-2 rounded hover:bg-gray-100 ${
              editor?.isActive('link') ? 'bg-gray-100' : ''
            }`}
            title="Link (⌘K)"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <button
            onClick={() => {
              const colors = ['#ffeb3b', '#4caf50', '#2196f3', '#f44336', '#9c27b0']
              const randomColor = colors[Math.floor(Math.random() * colors.length)]
              editor?.chain().focus().toggleHighlight({ color: randomColor }).run()
            }}
            className={`p-2 rounded hover:bg-gray-100`}
            title="Random Highlight Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className={`p-2 rounded hover:bg-gray-100 ${
                showMoreOptions ? 'bg-gray-100' : ''
              }`}
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showMoreOptions && (
              <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 1 }).run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('heading', { level: 1 }) ? 'bg-gray-50' : ''
                  }`}
                >
                  Heading 1
                </button>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('heading', { level: 2 }) ? 'bg-gray-50' : ''
                  }`}
                >
                  Heading 2
                </button>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('heading', { level: 3 }) ? 'bg-gray-50' : ''
                  }`}
                >
                  Heading 3
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('bulletList') ? 'bg-gray-50' : ''
                  }`}
                >
                  Bullet List
                </button>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('orderedList') ? 'bg-gray-50' : ''
                  }`}
                >
                  Numbered List
                </button>
                <button
                  onClick={() => {
                    editor?.chain().focus().toggleBlockquote().run()
                    setShowMoreOptions(false)
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm ${
                    editor?.isActive('blockquote') ? 'bg-gray-50' : ''
                  }`}
                >
                  Quote
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Block Menu */}
      {showBlockMenu && hoveredBlock && (
        <div 
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[200px]"
          style={{
            left: blockMenuPosition.x,
            top: hoveredBlock.offsetTop + 30,
          }}
        >
          <div className="space-y-1">
            <button
              onClick={() => {
                // Duplicate block logic
                setShowBlockMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button
              onClick={() => {
                // Move up logic
                setShowBlockMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Move up
            </button>
            <button
              onClick={() => {
                // Move down logic
                setShowBlockMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
            >
              <ArrowDown className="w-4 h-4" />
              Move down
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => {
                // Delete block logic
                setShowBlockMenu(false)
              }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close menus */}
      {(showSlashMenu || showBlockMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowSlashMenu(false)
            setShowBlockMenu(false)
          }}
        />
      )}

      {/* Editor Content */}
      <div ref={editorRef} className="notion-editor-container relative">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
