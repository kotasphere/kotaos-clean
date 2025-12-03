import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Mail, Send } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function DraftList({ drafts, onEdit, onDelete, onSend, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No email drafts yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Create a new draft with AI assistance
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map(draft => (
        <div
          key={draft.id}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {draft.subject || 'No subject'}
                </h3>
                {draft.tone && (
                  <Badge variant="outline" className="text-xs">
                    {draft.tone}
                  </Badge>
                )}
                {draft.status === 'sent' && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 text-xs">
                    Sent
                  </Badge>
                )}
              </div>
              
              {draft.to && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  To: {draft.to}
                </p>
              )}
              
              {draft.body && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {draft.body}
                </p>
              )}
              
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {format(new Date(draft.created_date), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            
            <div className="flex gap-1">
              {draft.status !== 'sent' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSend(draft)}
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Send email"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(draft)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(draft.id)}
                className="h-8 w-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}