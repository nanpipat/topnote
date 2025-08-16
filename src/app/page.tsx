"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import NoteEditor from "@/components/NoteEditor";
import { PlusIcon } from "lucide-react";

type Note = Database["public"]["Tables"]["notes"]["Row"];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        console.error("Error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Show user-friendly error message
        alert(
          "Unable to fetch notes. Please check your Supabase configuration and database setup."
        );
      } else {
        setNotes(data || []);
        if (data && data.length > 0 && !selectedNote) {
          setSelectedNote(data[0]);
        }
      }
    } catch (err) {
      console.error("Network or connection error:", err);
      alert(
        "Connection error. Please check your internet connection and Supabase configuration."
      );
    }
  };

  const createNote = async () => {
    if (!user) return;

    setIsCreating(true);
    const { data, error } = await supabase
      .from("notes")
      .insert([
        {
          title: "Untitled",
          content: "",
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating note:", error);
    } else {
      setNotes([data, ...notes]);
      setSelectedNote(data);
    }
    setIsCreating(false);
  };

  const updateNote = async (noteId: string, updates: Partial<Note>) => {
    const { error } = await supabase
      .from("notes")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", noteId);

    if (error) {
      console.error("Error updating note:", error);
    } else {
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, ...updates } : note
        )
      );
      if (selectedNote?.id === noteId) {
        setSelectedNote({ ...selectedNote, ...updates });
      }
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (error) {
      console.error("Error deleting note:", error);
    } else {
      const updatedNotes = notes.filter((note) => note.id !== noteId);
      setNotes(updatedNotes);
      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNotes.length > 0 ? updatedNotes[0] : null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">topnote</h1>
            <button
              onClick={createNote}
              disabled={isCreating}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
            >
              <PlusIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <Sidebar
          notes={notes}
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
          onDeleteNote={deleteNote}
          user={user}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedNote ? (
          <NoteEditor note={selectedNote} onUpdateNote={updateNote} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-xl font-medium mb-2">No note selected</h2>
              <p>
                Create a new note or select an existing one to start writing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
