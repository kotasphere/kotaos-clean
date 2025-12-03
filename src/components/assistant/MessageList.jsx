import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Brain, ExternalLink, SmilePlus } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import UserAvatar from "@/components/profile/UserAvatar";
import EmojiExplosion from "@/components/shared/EmojiExplosion";
import WeatherChart from "./WeatherChart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Function to detect and linkify URLs in text
const linkifyText = (text) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline inline-flex items-center gap-1"
        >
          {part}
          <ExternalLink className="w-3 h-3 inline" />
        </a>
      );
    }
    return part;
  });
};

const EMOJI_OPTIONS = [
  { emoji: '👍', label: 'Like', memoryContext: 'likes' },
  { emoji: '❤️', label: 'Love', memoryContext: 'loves' },
  { emoji: '😂', label: 'Laugh', memoryContext: 'finds funny' },
  { emoji: '😮', label: 'Wow', memoryContext: 'is amazed by' },
  { emoji: '😢', label: 'Sad', memoryContext: 'is saddened by' },
  { emoji: '👎', label: 'Dislike', memoryContext: 'dislikes' },
];

export default function MessageList({ conversations, isLoading, profile }) {
  const queryClient = useQueryClient();
  const [reactingTo, setReactingTo] = useState(null);
  const [explosions, setExplosions] = useState({});

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const triggerExplosion = (conversationId, emoji) => {
    setExplosions(prev => ({ ...prev, [conversationId]: { emoji, trigger: Date.now() } }));
    setTimeout(() => {
      setExplosions(prev => {
        const newExplosions = { ...prev };
        delete newExplosions[conversationId];
        return newExplosions;
      });
    }, 1000);
  };

  const addReaction = useMutation({
    mutationFn: async ({ conversationId, emoji, message, memoryContext }) => {
      queryClient.setQueryData(['conversations'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversationId 
            ? { ...conv, emoji_reaction: emoji }
            : conv
        );
      });

      triggerExplosion(conversationId, emoji);

      await base44.entities.Conversation.update(conversationId, {
        emoji_reaction: emoji
      });

      if (emoji === '👍' || emoji === '❤️' || emoji === '👎' || emoji === '😂') {
        base44.integrations.Core.InvokeLLM({
          prompt: `A user reacted with ${emoji} (${memoryContext}) to this AI assistant message:

"${message}"

Extract what the user is showing preference about. This could be:
- Foods, drinks, restaurants, cuisines
- Movies, TV shows, books, music, artists, genres
- Activities, hobbies, sports, games
- Places, cities, countries, venues
- Products, brands, services, apps
- People, personalities, celebrities
- Topics, subjects, interests
- Styles, aesthetics, designs
- Anything else meaningful they're expressing an opinion about

Return a JSON object with:
- topic: The specific thing they're reacting to (be specific! "Mexican food" not just "food", "Taylor Swift" not just "music")
- category: General category (food, entertainment, activity, place, product, person, topic, style, other)
- context: Brief context of what was being discussed

If the message doesn't contain anything meaningful to remember (like generic greetings or unclear content), return {"topic": null}.`,
          response_json_schema: {
            type: "object",
            properties: {
              topic: { type: "string", nullable: true },
              category: { type: "string", nullable: true },
              context: { type: "string", nullable: true }
            }
          }
        }).then(result => {
          if (result && result.topic) {
            const memoryKey = `${memoryContext}_${result.topic.toLowerCase().replace(/\s+/g, '_')}`;
            const memoryValue = `User ${memoryContext} ${result.topic}`;
            
            base44.entities.Memory.create({
              key: memoryKey,
              value: memoryValue,
              importance: emoji === '❤️' ? 5 : emoji === '👍' ? 4 : emoji === '👎' ? 3 : emoji === '😂' ? 3 : 3,
              context: `Category: ${result.category}. ${result.context}. Learned from emoji reaction (${emoji}) to: "${message.substring(0, 100)}"`
            }).then(() => {
              console.log(`✅ Created memory: ${memoryValue}`);
              queryClient.invalidateQueries({ queryKey: ['memories'] });
            });
          }
        }).catch(error => {
          console.error('Failed to create memory:', error);
        });
      }
      
      return { conversationId, emoji };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setReactingTo(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-12">
        <Brain className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Start a Conversation
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Ask me anything! I can help you manage tasks, create events, draft emails, 
          and remember important information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-2">
      {conversations.map((conv) => {
        const messageDate = new Date(conv.created_date);
        const formattedDate = format(messageDate, 'MMM d, yyyy');
        const formattedTime = format(messageDate, 'h:mm a');

        return (
          <div
            key={conv.id}
            className={`flex gap-2 sm:gap-3 w-full ${
              conv.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {conv.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
            )}

            <div
              className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 break-words relative group ${
                conv.role === 'assistant'
                  ? 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-[85%]'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white max-w-[80%]'
              }`}
              style={{ wordBreak: 'break-word' }}
            >
              {explosions[conv.id] && (
                <EmojiExplosion 
                  emoji={explosions[conv.id].emoji} 
                  trigger={explosions[conv.id].trigger}
                />
              )}
              
              {conv.emoji_reaction && (
                <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-lg border border-gray-200 dark:border-gray-700 text-lg z-10 animate-in zoom-in duration-300">
                  {conv.emoji_reaction}
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap break-words">
                {conv.role === 'assistant' ? linkifyText(conv.message) : conv.message}
              </p>
              
              {conv.role === 'assistant' && 
               /weather|forecast|temperature/i.test(conv.message) && 
               /\d{1,2}(am|pm|AM|PM).*\d+°/i.test(conv.message) && (
                <WeatherChart data={conv.message} />
              )}
              
              <div className="flex items-center justify-between mt-2 gap-2">
                <span className={`text-xs ${
                  conv.role === 'assistant' 
                    ? 'text-gray-400 dark:text-gray-500' 
                    : 'text-blue-100'
                }`}>
                  {formattedDate} at {formattedTime}
                </span>
                <div className="flex gap-1">
                  {conv.role === 'assistant' && (
                    <Popover open={reactingTo === conv.id} onOpenChange={(open) => setReactingTo(open ? conv.id : null)}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 opacity-100 transition-opacity"
                        >
                          <SmilePlus className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="end">
                        <div className="flex gap-1">
                          {EMOJI_OPTIONS.map(({ emoji, label, memoryContext }) => (
                            <button
                              key={emoji}
                              onClick={() => addReaction.mutate({ 
                                conversationId: conv.id, 
                                emoji,
                                message: conv.message,
                                memoryContext
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
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => handleCopy(conv.message)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>

            {conv.role === 'user' && (
              <div className="flex-shrink-0">
                <UserAvatar size="sm" showCrown={true} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}