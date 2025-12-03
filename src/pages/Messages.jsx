import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Users, Loader2, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import EmojiExplosion from "@/components/shared/EmojiExplosion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_OPTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '👎', label: 'Dislike' },
];

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [reactingTo, setReactingTo] = useState(null);
  const [explosions, setExplosions] = useState({});
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Get all conversations the user is part of
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['chatConversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const allConversations = await base44.entities.ChatConversation.filter({}, '-last_message_time');
      // Filter to only conversations where user is a participant
      return allConversations.filter(conv => 
        conv.participants && conv.participants.includes(user.id)
      );
    },
    enabled: !!user?.id,
  });

  // Get messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation?.id) return [];
      return await base44.entities.Message.filter(
        { conversation_id: selectedConversation.id },
        'created_date'
      );
    },
    enabled: !!selectedConversation?.id,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Get connected contacts for creating new conversations
  const { data: connectedContacts = [] } = useQuery({
    queryKey: ['connectedContacts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Contact.filter({
        created_by: user.email,
        connection_status: 'connected'
      });
    },
    enabled: !!user?.email,
  });

  const triggerExplosion = (messageId, emoji) => {
    setExplosions(prev => ({ ...prev, [messageId]: { emoji, trigger: Date.now() } }));
    setTimeout(() => {
      setExplosions(prev => {
        const newExplosions = { ...prev };
        delete newExplosions[messageId];
        return newExplosions;
      });
    }, 1000);
  };

  const deleteConversation = useMutation({
    mutationFn: async (conversationId) => {
      await base44.entities.ChatConversation.delete(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
      if (selectedConversation) {
        setSelectedConversation(null);
      }
    },
  });

  const addReaction = useMutation({
    mutationFn: async ({ messageId, emoji }) => {
      // Optimistically update UI
      queryClient.setQueryData(['messages', selectedConversation?.id], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(msg => 
          msg.id === messageId 
            ? { ...msg, emoji_reaction: emoji }
            : msg
        );
      });

      // Trigger explosion
      triggerExplosion(messageId, emoji);

      // Update database
      await base44.entities.Message.update(messageId, {
        emoji_reaction: emoji
      });
      
      return { messageId, emoji };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setReactingTo(null);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (messageData) => {
      return await base44.entities.Message.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['chatConversations'] });
      setMessageText("");
    },
  });

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const otherUserId = selectedConversation.participants.find(id => id !== user.id);

    // Send the message
    await sendMessage.mutateAsync({
      conversation_id: selectedConversation.id,
      sender_id: user.id,
      recipient_id: otherUserId,
      content: messageText.trim(),
    });

    // Update conversation's last_message
    try {
      await base44.entities.ChatConversation.update(selectedConversation.id, {
        last_message: messageText.trim().substring(0, 100),
        last_message_time: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update conversation:', error);
    }
  };

  // Mark incoming messages as read when viewing conversation
  useEffect(() => {
    if (!selectedConversation?.id || !user?.id) return;
    
    const unreadMessages = messages.filter(
      m => m.recipient_id === user.id && !m.read
    );
    
    unreadMessages.forEach(async (msg) => {
      try {
        await base44.entities.Message.update(msg.id, { read: true });
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    });
  }, [messages, selectedConversation, user]);

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (connectedContacts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              No Connections Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to connect with other KOTA OS users before you can message them.
            </p>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 mb-6 text-left max-w-md mx-auto">
              <p><strong>How to connect:</strong></p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to Contacts and add someone with their KOTA OS email</li>
                <li>Click the three dots (•••) on their contact card</li>
                <li>Click "Send Connection Request"</li>
                <li>Once they accept, you can message each other!</li>
              </ol>
            </div>
            <Button
              onClick={() => window.location.href = '/contacts'}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Go to Contacts
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30 flex">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-80 border-r border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Immediate action on touch for iOS
                  const sidebar = document.querySelector('[data-sidebar="sidebar"]');
                  const trigger = document.querySelector('[data-sidebar-trigger]');
                  
                  if (trigger) {
                    trigger.click();
                  } else if (sidebar) {
                    sidebar.setAttribute('data-state', 'expanded');
                    sidebar.setAttribute('data-mobile', 'open');
                    const overlay = document.querySelector('[data-sidebar-overlay]');
                    if (overlay) {
                      overlay.setAttribute('data-state', 'open');
                    }
                  }
                }}
                onClick={(e) => {
                  e.preventDefault();
                  // Desktop fallback only
                  const sidebar = document.querySelector('[data-sidebar="sidebar"]');
                  const trigger = document.querySelector('[data-sidebar-trigger]');
                  
                  if (trigger) {
                    trigger.click();
                  } else if (sidebar) {
                    sidebar.setAttribute('data-state', 'expanded');
                    sidebar.setAttribute('data-mobile', 'open');
                    const overlay = document.querySelector('[data-sidebar-overlay]');
                    if (overlay) {
                      overlay.setAttribute('data-state', 'open');
                    }
                  }
                }}
                className="lg:hidden -webkit-tap-highlight-transparent active:scale-95 transition-transform"
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </Button>
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
            </div>
            
            {/* Contacts Button in List View */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/contacts'}
              className="flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="hidden sm:inline">Contacts</span>
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-2">Start messaging your connected contacts!</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map(conv => {
                const otherUserId = conv.participants.find(id => id !== user.id);
                const contact = connectedContacts.find(c => c.user_id === otherUserId);
                
                return (
                  <div
                    key={conv.id}
                    className={`p-3 rounded-lg mb-2 transition-colors group relative ${
                      selectedConversation?.id === conv.id
                        ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => {
                        setSelectedConversation(conv);
                      }}
                    >
                      <Avatar>
                        <AvatarImage src={contact?.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {contact?.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {contact?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                    
                    {/* Delete Button - Shows on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const contactName = contact?.name || 'Unknown User';
                        const confirmed = confirm(`Delete conversation with ${contactName}?\n\nYou will remain connected and can start a new conversation anytime.`);
                        if (confirmed) {
                          deleteConversation.mutate(conv.id);
                        }
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Select a conversation to start messaging
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                  </Button>
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                      {connectedContacts.find(c => 
                        c.user_id === selectedConversation.participants.find(id => id !== user.id)
                      )?.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                      {connectedContacts.find(c => 
                        c.user_id === selectedConversation.participants.find(id => id !== user.id)
                      )?.name || 'Unknown User'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Connected</p>
                  </div>
                </div>
                
                {/* Contacts Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/contacts'}
                  className="flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="hidden sm:inline">Contacts</span>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 pb-24">
              <div className="space-y-4 pb-4">
                {messages.map(msg => {
                  const isOwn = msg.sender_id === user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg relative group break-words overflow-hidden ${
                          isOwn
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        {/* Emoji Explosion Effect */}
                        {explosions[msg.id] && (
                          <EmojiExplosion 
                            emoji={explosions[msg.id].emoji} 
                            trigger={explosions[msg.id].trigger}
                          />
                        )}
                        
                        {/* Show existing reaction */}
                        {msg.emoji_reaction && (
                          <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-200 dark:border-gray-700 text-lg z-10 animate-in zoom-in duration-300">
                            {msg.emoji_reaction}
                          </div>
                        )}
                        
                        <p className="text-sm break-words overflow-wrap-anywhere">{msg.content}</p>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <p className={`text-xs ${isOwn ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {format(new Date(msg.created_date), 'h:mm a')}
                          </p>
                          
                          {/* Emoji Reaction Button - Show for all messages */}
                          <Popover open={reactingTo === msg.id} onOpenChange={(open) => setReactingTo(open ? msg.id : null)}>
                            <PopoverTrigger asChild>
                              <button className="opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <SmilePlus className="w-3 h-3" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="end">
                              <div className="flex gap-1">
                                {EMOJI_OPTIONS.map(({ emoji, label }) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addReaction.mutate({ 
                                      messageId: msg.id, 
                                      emoji
                                    })}
                                    className="text-2xl hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title={label}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky bottom-0 z-10">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessage.isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {sendMessage.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}