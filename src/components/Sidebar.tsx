'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { FileTextIcon, TrashIcon, ShareIcon, LogOutIcon } from 'lucide-react'

type Note = Database['public']['Tables']['notes']['Row']

interface SidebarProps {
  notes: Note[]
  selectedNote: Note | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (noteId: string) => void
  user: User
}

export default function Sidebar({ notes, selectedNote, onSelectNote, onDeleteNote, user }: SidebarProps) {
  const { signOut } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this note?')) {
      setDeletingId(noteId)
      await onDeleteNote(noteId)
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      return 'Today'
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileTextIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No notes yet</p>
            <p className="text-xs text-gray-400">Create your first note</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-gray-900 truncate">
                      {note.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {note.content ? 
                        note.content.replace(/[#*`_~]/g, '').substring(0, 60) + (note.content.length > 60 ? '...' : '')
                        : 'No content'
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {note.is_public && (
                      <ShareIcon className="h-3 w-3 text-green-500" />
                    )}
                    <button
                      onClick={(e) => handleDelete(note.id, e)}
                      disabled={deletingId === note.id}
                      className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Info & Sign Out */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Sign out"
          >
            <LogOutIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
