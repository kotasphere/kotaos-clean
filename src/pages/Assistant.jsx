import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Trash2, Brain, Loader2, BookOpen, CheckCircle, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { format }                       from "date-fns";
import OnboardingDialog                 from "../components/assistant/OnboardingDialog";
import MessageList                      from "../components/assistant/MessageList";
import IntentProcessor                  from "../components/assistant/IntentProcessor";
import BadgeEarnedDialog                from "../components/badges/BadgeEarnedDialog";
import { checkAndAwardBadges }          from "../components/badges/BadgeChecker";

export default function AssistantPage() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [createdItems, setCreatedItems] = useState([]);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // CRITICAL: Use unique query key per user
  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Profile.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Conversation.filter({ created_by: user.email }, '-created_date');
    },
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: memories } = useQuery({
    queryKey: ['memories', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Memory.filter({ created_by: user.email }, '-importance');
    },
    initialData: [],
    enabled: !!user?.email,
  });

  useEffect(() => {
    if (!profile) return;
    if (profile.ai_name) return; // Already set
    
    setShowOnboarding(true);
  }, [profile?.ai_name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, createdItems]);

  const createConversation = useMutation({
    mutationFn: (data) => base44.entities.Conversation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const checkBadges = async () => {
    if (user) {
      const newBadges = await checkAndAwardBadges(user.id);
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        setNewlyEarnedBadge(newBadges[0]);
      }
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const result = await base44.integrations.Core.UploadFile({ file });
        return {
          name: file.name,
          url: result.file_url,
          type: file.type
        };
      });

      const uploadedFileData = await Promise.all(uploadPromises);
      setUploadedFiles([...uploadedFiles, ...uploadedFileData]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file(s). Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const buildContext = () => {
    const memoryContext = memories.length > 0
      ? `\n\n🧠 IMPORTANT USER MEMORIES - USE THESE TO PERSONALIZE RESPONSES:\n${memories.map(m => `- ${m.key}: ${m.value}`).join('\n')}\n\n⚡ When user asks about something in memories (e.g., "who's my doctor?"), IMMEDIATELY recall it from above!`
      : '';
    
    // Replace the old code with new:
    const _oldMemoryContext = memories.length > 0
      ? `\n\n🧠 IMPORTANT USER MEMORIES - USE THESE TO PERSONALIZE RESPONSES:\n${memories.map(m => `- ${m.key}: ${m.value}`).join('\n')}\n\n⚡ When user asks about something in memories (e.g., "who's my doctor?"), IMMEDIATELY recall it from above!`
      : '';
    
    const userName = profile?.username || 'there';
    const profileContext = profile?.ai_name 
      ? `\n\nYou are ${profile.ai_name}, the user's personal AI assistant in their Personal OS. The user's name is ${userName}, always address them by their name.`
      : `\n\nYou are a helpful personal AI assistant in Personal OS. The user's name is ${userName}, always address them by their name.`;

    const now = new Date();
    const cstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const currentDateTime = cstDate.toISOString();
    const readableDate = cstDate.toLocaleString('en-US', { 
      timeZone: 'America/Chicago',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const patternsContext = profile?.user_patterns ? `\n\nLearned User Patterns:
- Work Style: ${profile.user_patterns.work_patterns || 'Unknown'}
- Communication Style: ${profile.user_patterns.communication_style || 'Unknown'}
- Time Management: ${profile.user_patterns.time_management || 'Unknown'}
- Frequent Categories: ${profile.user_patterns.frequent_categories?.join(', ') || 'None yet'}
- Task Completion Rate: ${profile.user_patterns.completion_rate || 0}%
- Preferred Reminder Times: ${profile.user_patterns.preferred_reminder_times?.join(', ') || 'Not set'}

Use these patterns to personalize your responses and suggestions. Adapt to their style.` : '';

    const toneGuidance = {
      friendly: 'Be warm and supportive. Keep responses concise (2-4 sentences) unless asked for details.',
      professional: 'Be polished and business-like. Get to the point quickly (1-3 sentences).',
      concise: 'Be ultra-brief. One sentence answers. No fluff.',
      sarcastic: 'Be witty but brief. Make it fun but get to the point fast.'
    };

    return `${profileContext}${memoryContext}${patternsContext}\n\nUser's tone preference: ${profile?.tone_preference || 'friendly'}
${toneGuidance[profile?.tone_preference || 'friendly']}

🎯 GOLDEN RULE: Keep responses SHORT (1-4 sentences max) unless user asks for more detail.

CRITICAL: Current date and time is ${readableDate} (${currentDateTime})

═══════════════════════════════════════════════════════════════
🎯 YOUR CORE CAPABILITIES - BE SMART ABOUT WHAT THE USER WANTS
═══════════════════════════════════════════════════════════════

You are a CONVERSATIONAL AI first, and an ACTION-TAKING assistant second.

🗣️ CONVERSATIONAL MODE (Default):
When users are:
- Asking questions ("What's the weather?", "How's traffic?", "What time does Target close?")
- Making small talk ("How are you?", "Tell me a joke")
- Seeking advice or information
- Just chatting casually

→ BE CONVERSATIONAL. Answer naturally. DON'T create tasks/events unless EXPLICITLY asked.
→ Use "add_context_from_internet: true" for: weather, traffic, store hours, local info, news, etc.

SPECIAL RULE FOR LOCAL INFO:
When answering about stores, restaurants, doctors, theaters, businesses:
- PROVIDE FULL DETAILS: hours, phone number, address, website
- This is when details matter! Example:

✅ User: "What time does Walmart close?"
   Good: "Walmart on 5th Ave is open until 11 PM tonight. Located at 123 Main St, phone: (555) 123-4567. 🛒"

✅ User: "Find me a doctor"
   Good: "Dr. Smith Family Practice: 123 Medical Plaza, Lynn Haven, FL 32444. Phone: (850) 555-1234. Open Mon-Fri 9am-5pm. 🏥"

For everything else (weather, jokes, advice): Keep it brief (1-2 sentences).

⚡ ACTION MODE (Only when EXPLICITLY requested):
When users say CLEAR action words:
- "Add a task to...", "Remind me to...", "Create a task..."
- "Schedule a meeting...", "Add to my calendar..."
- "Track this bill...", "Add this subscription..."

→ For SIMPLE items (tasks, events, subscriptions, bills): Create immediately & confirm briefly
→ For COMPLEX items (assets, projects): ASK FOLLOW-UP QUESTIONS FIRST

Examples:
✅ SIMPLE - Create immediately (keep confirmation SHORT):
User: "Remind me to buy milk" → "Done! Reminder added. 🥛"
User: "Schedule dentist Friday 2pm" → "Added to calendar! 🦷"
User: "Add electricity bill $150" → "Bill added! 💵"

✅ COMPLEX - Ask follow-up questions (ASSETS):
User: "Add my new TV to assets"
→ "Great! Quick questions:
   • Which property/home?
   • Current value?
   • Brand/purchase date?"

✅ COMPLEX - Ask follow-up questions (PROJECTS):  
User: "Start Website Redesign project"
→ "Perfect! I need:
   • Target completion date?
   • Team members?
   • Key milestones?"

🚫 NEVER CREATE ITEMS WHEN USER IS JUST CHATTING:
❌ User: "I need to call mom soon" → DON'T create a task, just acknowledge
❌ User: "I should probably go to the gym" → DON'T create a task, just encourage
❌ User: "There's a sale at Target" → DON'T create anything, just respond conversationally

═══════════════════════════════════════════════════════════════
🌐 REAL-TIME LOCAL & WEB DATA ACCESS
═══════════════════════════════════════════════════════════════

You have access to LIVE internet data. Use it for:
✅ Weather conditions and forecasts
✅ Traffic and directions  
✅ Store hours, restaurant info, business details
✅ Local events and news
✅ Product availability, prices
✅ Sports scores, movie times
✅ Any real-time information

When user asks these types of questions, I'll automatically pass "add_context_from_internet: true" to give you fresh data.

═══════════════════════════════════════════════════════════════
📎 FILE/IMAGE ANALYSIS
═══════════════════════════════════════════════════════════════

When user uploads files:
1. Analyze and extract info (vendor, amount, etc.)
2. Summarize BRIEFLY (2-3 sentences max)
3. ASK: "Add to Bills/Assets?" (keep it SHORT!)

DON'T auto-create from uploads - always confirm first!

═══════════════════════════════════════════════════════════════
🎯 DECISION FLOWCHART
═══════════════════════════════════════════════════════════════

User message → Is it a question/info request?
              ↓ YES                    ↓ NO
         Answer it!          Does it have action words?
    (weather, traffic,              ↓ YES        ↓ NO
     store hours, etc.)         Take action!    Just chat!
                                                (Don't create anything)

═══════════════════════════════════════════════════════════════

Remember: You're having a CONVERSATION. Only take action when the user clearly wants you to. When in doubt, just chat!`;
  };

  const handleSend = async () => {
    if ((!message.trim() && uploadedFiles.length === 0) || isProcessing) return;

    const userMessage = message.trim() || "[Uploaded file(s)]";
    const filesToSend = uploadedFiles.map(f => f.url);
    
    setMessage("");
    setUploadedFiles([]);
    setIsProcessing(true);
    setCreatedItems([]);

    try {
      await createConversation.mutateAsync({
        role: 'user',
        message: userMessage,
      });

      const recentMessages = conversations.slice(0, 5).reverse();
      const messageHistory = recentMessages.map(m => ({
        role: m.role,
        content: m.message
      }));

      const context = buildContext();

      // Enhanced detection for when to use internet context
      const needsLocalData = /\b(weather|forecast|temperature|rain|snow|sunny|cloudy|storm)\b/i.test(userMessage) ||
                            /\b(traffic|congestion|road|route|directions|drive time)\b/i.test(userMessage) ||
                            /\b(store|shop|restaurant|business|cafe|hours|open|close|closes)\b/i.test(userMessage) ||
                            /\b(nearby|near me|local|in my area|around here)\b/i.test(userMessage) ||
                            /\b(available at|in stock|price at|cost at)\b/i.test(userMessage) ||
                            /\b(news|current|latest|today's|happening)\b/i.test(userMessage) ||
                            /\b(movie times|show times|events|concert)\b/i.test(userMessage) ||
                            /\b(score|game|match|sports)\b/i.test(userMessage);

      const isInformationalQuery = /\b(what|when|where|how|who|why|is|are|does|do|can|will)\b/i.test(userMessage);

      const promptText = filesToSend.length > 0
        ? `${context}\n\nConversation history:\n${messageHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}\n\n${filesToSend.length > 0 ? `User has uploaded ${filesToSend.length} file(s). Analyze carefully and respond. If it's a bill/receipt/document, offer to create the appropriate entity - but ASK first, don't auto-create.` : ''}`
        : `${context}\n\nConversation history:\n${messageHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${userMessage}

CRITICAL: When user asks to "add", "create", "schedule", or "track" anything:
- Extract ALL info (title, date, time, amount, etc.) from their message
- Respond with a BRIEF confirmation (e.g., "Done! Added to your calendar for Jan 5th at 2pm ✅")
- ALWAYS use confirmation words like "Done!", "Added!", "Scheduled!", "Created!" or the ✅ emoji
- Keep confirmation to 1-2 sentences MAX unless they ask for more details`;

      // Detect if user is asking about shopping and might want local deals
      const isShoppingQuery = /\b(shop|shopping|buy|purchase|get)\b/i.test(userMessage) &&
                             !/\b(add|create|schedule)\b/i.test(userMessage);
      
      let finalPrompt = promptText;
      
      // Add smart follow-up for shopping queries
      if (isShoppingQuery) {
        finalPrompt += `\n\n🛍️ SHOPPING MODE: 
        - Ask what specific item they're shopping for
        - Once they tell you, use your internet access to find:
          • Local stores that carry it (with addresses and hours)
          • Current deals and prices
          • Stock availability if possible
        - Be helpful and specific!`;
      }
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: finalPrompt,
        file_urls: filesToSend.length > 0 ? filesToSend : undefined,
        add_context_from_internet: needsLocalData || isShoppingQuery || (isInformationalQuery && !filesToSend.length),
      });

      await createConversation.mutateAsync({
        role: 'assistant',
        message: response,
      });

      // Pass conversation context to IntentProcessor
      const conversationContext = messageHistory.map(m => m.content).join('\n');
      const items = await IntentProcessor.processMessage(userMessage, response, queryClient, conversationContext);
      if (items && items.length > 0) {
        setCreatedItems(items);
        await checkBadges();
      }

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all conversation history?')) {
      try {
        for (const conv of conversations) {
          await base44.entities.Conversation.delete(conv.id);
        }
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const handleJournal = () => {
    setMessage("Help me reflect on today. What went well? What could I improve?");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30">
      <OnboardingDialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        profile={profile}
      />

      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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
            {/* KOTA Logo - Light mode (black logo) */}
            <img 
              src="https://qtrypzzcjebvfciynt.supabase.co/storage/v1/object/public/base44-prod/public/68ff92f4fc2f1b7aa86a06b2/31673f46d_file_00000000a22461f798f22c646057aa3b1.png" 
              alt="KOTA OS"
              className="w-10 h-10 object-contain dark:hidden"
            />
            {/* KOTA Logo - Dark mode (white logo) */}
            <img 
              src="https://qtrypzzcjebvfciynt.supabase.co/storage/v1/object/public/base44-prod/public/68ff92f4fc2f1b7aa86a06b2/4ecec0417_file_00000000f3f061f7ad85b20d3e55a74e.png" 
              alt="KOTA OS"
              className="w-10 h-10 object-contain hidden dark:block"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {profile?.ai_name || 'AI Assistant'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your personal AI companion</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleJournal}>
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-3 sm:p-6">
          <ScrollArea className="flex-1 pr-4 sm:pr-4 mb-[200px] sm:mb-44 overflow-x-hidden">
            <MessageList
              conversations={[...conversations].reverse()}
              isLoading={isLoading}
              profile={profile}
            />

            {createdItems.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">Items Created Successfully!</h3>
                </div>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
                  {createdItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div ref={scrollRef} className="h-4" />
          </ScrollArea>

          <Card className="shadow-lg border-gray-200 dark:border-gray-800 fixed bottom-[110px] sm:bottom-20 left-3 right-3 sm:left-6 sm:right-6 sm:mx-auto max-w-4xl z-10 bg-white dark:bg-gray-900">
            <CardContent className="p-2 sm:p-4">
              {uploadedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                      <span className="text-sm text-blue-900 dark:text-blue-100 truncate max-w-[150px]">
                        {file.name}
                      </span>
                      <button
                        onClick={() => removeFile(idx)}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 sm:gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isProcessing}
                  className="flex-shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                <Input
                  placeholder="Ask me anything or upload a file..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={isProcessing}
                  className="flex-1 min-w-0"
                />
                <Button
                  onClick={handleSend}
                  disabled={(!message.trim() && uploadedFiles.length === 0) || isProcessing}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex-shrink-0"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                I can analyze bills, receipts, photos, documents and help you manage tasks, events, contacts, and more. Just ask or upload!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <BadgeEarnedDialog
        badge={newlyEarnedBadge}
        open={!!newlyEarnedBadge}
        onClose={() => setNewlyEarnedBadge(null)}
      />
    </div>
  );
}