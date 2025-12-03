import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, Users, CheckSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

export default function TaskChatDialog({ open, onClose, task, contacts }) {
  const [messageText, setMessageText] = useState('');
  const [isAIResponding, setIsAIResponding] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['taskMessages', task?.id],
    queryFn: () => base44.entities.Message.filter({ task_id: task.id }, '-created_date'),
    enabled: !!task?.id,
  });

  const sendMessage = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: async (newMessage) => {
      queryClient.invalidateQueries({ queryKey: ['taskMessages', task?.id] });
      setMessageText('');

      // Send notifications to all task collaborators except sender
      if (!newMessage.is_ai_message && task?.collaborators) {
        for (const collaboratorId of task.collaborators) {
          if (collaboratorId === user.id) continue;
          
          const contact = contacts.find(c => c.id === collaboratorId);
          if (contact && contact.user_id) {
            try {
              await base44.entities.Notification.create({
                user_id: contact.user_id,
                type: 'message',
                title: `New Task Message: ${task.title}`,
                message: `${user.email}: "${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}"`,
                from_user_id: user.id,
                action_url: createPageUrl('Tasks')
              });
            } catch (error) {
              console.error('Failed to send notification:', error);
            }
          }
        }
      }
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !task) return;

    // Send user message
    await sendMessage.mutateAsync({
      task_id: task.id,
      sender_id: user.id,
      content: messageText,
      is_ai_message: false
    });

    setMessageText('');
  };

  const handleAskAI = async () => {
    if (!task || !task.ai_assistant_enabled) return;
    
    setIsAIResponding(true);
    try {
      // Get recent conversation history
      const recentMessages = messages.slice(-15).reverse();
      const conversationHistory = recentMessages.map(m => {
        const sender = m.is_ai_message ? 'AI Assistant' : 
                      contacts.find(c => c.id === m.sender_id)?.name || 'Team member';
        return `${sender}: ${m.content}`;
      }).join('\n');

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an intelligent AI assistant helping a team complete this task. You're observing their conversation:

TASK DETAILS:
- Title: ${task.title}
- Notes: ${task.notes || 'No notes'}
- Priority: ${task.priority}
- Status: ${task.status}
- Due Date: ${task.due_date ? format(new Date(task.due_date), 'PPP') : 'Not set'}

RECENT CONVERSATION:
${conversationHistory}

INSTRUCTIONS:
1. Analyze what the team is discussing about this task
2. Understand their specific questions, blockers, or debates
3. Provide helpful, contextual advice based on their ACTUAL conversation
4. If they're discussing implementation, offer specific technical insights
5. If they're stuck, suggest concrete next steps
6. If they're debating approaches, help them evaluate pros/cons
7. If they're asking "how to", provide step-by-step guidance
8. Be concise and actionable

Don't give generic task advice. Respond to their SPECIFIC discussion about THIS task.`
      });

      await sendMessage.mutateAsync({
        task_id: task.id,
        sender_id: 'ai_assistant',
        content: aiResponse,
        is_ai_message: true
      });
    } catch (error) {
      console.error('AI response error:', error);
      await sendMessage.mutateAsync({
        task_id: task.id,
        sender_id: 'ai_assistant',
        content: "I'm having trouble processing that right now. Could you try again?",
        is_ai_message: true
      });
    } finally {
      setIsAIResponding(false);
    }
  };

  const collaboratorsList = task?.collaborators
    ?.map(id => contacts.find(c => c.id === id))
    .filter(Boolean) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="flex items-center gap-2">
                {task?.title}
                {task?.ai_assistant_enabled && (
                  <Sparkles className="w-4 h-4 text-blue-500" />
                )}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-3 h-3 text-gray-500" />
                <div className="flex -space-x-2">
                  {collaboratorsList.map(collab => (
                    <Avatar key={collab.id} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                      <AvatarImage src={collab.avatar_url} />
                      <AvatarFallback className="text-xs">{collab.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                  {task?.ai_assistant_enabled && (
                    <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600">
                      <AvatarFallback className="text-xs text-white">AI</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {collaboratorsList.length + (task?.ai_assistant_enabled ? 1 : 0)} member{collaboratorsList.length + (task?.ai_assistant_enabled ? 1 : 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No messages yet. Start collaborating on this task!
                </p>
                {task?.ai_assistant_enabled && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    💡 AI is listening and ready to help when you need it
                  </p>
                )}
              </div>
            )}
            {messages.map(msg => {
              const isOwn = msg.sender_id === user.id;
              const isAI = msg.is_ai_message;
              const sender = isAI ? null : contacts.find(c => c.id === msg.sender_id);

              return (
                <div key={msg.id} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  {!isOwn && (
                    <Avatar className="w-8 h-8">
                      {isAI ? (
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <Sparkles className="w-4 h-4" />
                        </AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={sender?.avatar_url} />
                          <AvatarFallback>{sender?.name?.[0] || '?'}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  )}
                  <div className="max-w-[70%]">
                    <div className={`px-4 py-2 rounded-2xl ${
                      isOwn 
                        ? 'bg-purple-600 text-white' 
                        : isAI
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {!isOwn && !isAI && (
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                          {sender?.name || 'Unknown'}
                        </p>
                      )}
                      {isAI && (
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          AI Assistant
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(msg.created_date), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
            {isAIResponding && (
              <div className="flex gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Sparkles className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs text-blue-600 dark:text-blue-400">Analyzing conversation...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <div className="flex gap-3">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isAIResponding}
            />
            <Button onClick={handleSendMessage} disabled={!messageText.trim() || isAIResponding}>
              <Send className="w-4 h-4" />
            </Button>
            {task?.ai_assistant_enabled && (
              <Button 
                onClick={handleAskAI} 
                disabled={isAIResponding || messages.length === 0}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                title="Ask AI to analyze conversation and provide help"
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
          </div>
          {task?.ai_assistant_enabled && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI is listening to your conversation. Click the ✨ button when you need help.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}