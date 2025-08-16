import { createServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileTextIcon } from "lucide-react";

interface SharePageProps {
  params: {
    token: string;
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const supabase = await createServerClient();

  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("share_token", params.token)
    .eq("is_public", true)
    .single();

  if (error || !note) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <FileTextIcon className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">topnote</h1>
              <p className="text-sm text-gray-500">Shared document</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {note.title || "Untitled"}
          </h1>
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span>Last updated: {formatDate(note.updated_at)}</span>
            <span>•</span>
            <span>Read-only</span>
          </div>
        </div>

        <div
          className="prose prose-gray prose-lg max-w-none share-content"
          dangerouslySetInnerHTML={{ __html: note.content || "" }}
        />
      </div>

      {/* Footer */}
      {/* <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Created with topnote</p>
            <p className="mt-1">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                Create your own notes →
              </Link>
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export async function generateMetadata({ params }: SharePageProps) {
  const supabase = await createServerClient();

  const { data: note } = await supabase
    .from("notes")
    .select("title, content")
    .eq("share_token", params.token)
    .eq("is_public", true)
    .single();

  if (!note) {
    return {
      title: "Note not found - topnote",
    };
  }

  const description = note.content
    ? note.content.replace(/[#*`_~]/g, "").substring(0, 160) + "..."
    : "A shared note from topnote";

  return {
    title: `${note.title || "Untitled"} - topnote`,
    description,
  };
}
