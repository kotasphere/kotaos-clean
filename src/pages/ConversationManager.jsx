import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConversationManagerPage() {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Conversation.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Memory.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const deleteConversation = useMutation({
    mutationFn: (id) => base44.entities.Conversation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const deleteAllConversations = useMutation({
    mutationFn: async () => {
      for (const conv of conversations) {
        await base44.entities.Conversation.delete(conv.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setDeleteTarget(null);
    },
  });

  const handleDeleteSingle = async (conv) => {
    if (window.confirm(`Delete this message?\n\n"${conv.message.substring(0, 100)}${conv.message.length > 100 ? '...' : ''}"`)) {
      await deleteConversation.mutateAsync(conv.id);
    }
  };

  const handleDeleteAll = () => {
    setDeleteTarget('all');
  };

  const confirmDeleteAll = async () => {
    await deleteAllConversations.mutateAsync();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Conversation History
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Manage your chat messages with the AI assistant
              </p>
            </div>
          </div>
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            disabled={conversations.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All
          </Button>
        </div>

        {/* Important Memories Notice */}
        {memories.length > 0 && (
          <Card className="p-4 mb-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                  Your Memories Are Safe
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You have {memories.length} saved {memories.length === 1 ? 'memory' : 'memories'}. 
                  These are stored separately and won't be deleted when you clear conversations.
                  The assistant will always remember important information about you.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Messages ({conversations.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No conversation history</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Start chatting with your AI assistant to see messages here
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      conv.role === 'assistant'
                        ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {conv.role === 'assistant' ? (
                            <>
                              <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                                AI Assistant
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                              You
                            </span>
                          )}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(conv.created_date), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                          {conv.message.length > 200
                            ? `${conv.message.substring(0, 200)}...`
                            : conv.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSingle(conv)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Warning about memories */}
        <Card className="p-4 mt-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Conversation Deletion
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mb-2">
                Deleting conversations only removes the chat history. Your assistant will:
              </p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1">
                <li>Still remember all saved memories about you</li>
                <li>Keep all tasks, events, bills, and other data you've created</li>
                <li>Continue to learn your preferences and patterns</li>
              </ul>
              <p className="text-blue-700 dark:text-blue-300 mt-2">
                To forget specific information, ask your assistant: "Please forget about [topic]"
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteTarget === 'all'} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Conversations?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently delete all {conversations.length} conversation messages.
              </p>
              <p className="font-semibold text-green-700 dark:text-green-400">
                ✅ Your memories ({memories.length}) and all created items (tasks, events, etc.) will be preserved.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All Messages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}