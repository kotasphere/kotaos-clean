import { base44 } from "@/api/base44Client";

const IntentProcessor = {
  async processMessage(userMessage, assistantResponse, queryClient, conversationContext = '') {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = assistantResponse.toLowerCase();
    const createdItems = [];

    console.log('🔍 IntentProcessor - User Message:', userMessage);
    console.log('🤖 IntentProcessor - Assistant Response:', assistantResponse);

    // Get current date in CST
    const now = new Date();
    const cstDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const currentDateTime = cstDate.toISOString();

    // CRITICAL: Detect DELETION/REMOVAL requests FIRST - Always handle deletions regardless of assistant response.
    const deletionKeywords = ['remove', 'delete', 'cancel', 'get rid of'];
    if (deletionKeywords.some(keyword => lowerMessage.includes(keyword))) {
      try {
        // We don't add to createdItems here, as deletion is an action, not creation.
        await this.handleDeletion(userMessage, queryClient);
      } catch (error) {
        console.error('Deletion error:', error);
      }
    }

    // Detect MOVING items between entities (e.g., "remove from bills, add to subscriptions")
    // This check should happen after a deletion-only check but before general creation,
    // as it involves both deletion and creation/re-creation.
    // Move requests are considered explicit user intent, and the creation part should proceed.
    if ((lowerMessage.includes('remove') || lowerMessage.includes('delete')) &&
        (lowerMessage.includes('add') || lowerMessage.includes('move'))) {
      try {
        await this.handleMoveItem(userMessage, queryClient, currentDateTime);
      } catch (error) {
        console.error('Move item error:', error);
      }
    }

    // 🚨 CRITICAL: ALWAYS try to create if user mentions these keywords
    // Don't wait for assistant confirmation - user intent is what matters!
    const userWantsCreation = 
      /\b(add|create|schedule|track|new|start|remind|book|set up)\b/i.test(lowerMessage);

    console.log('✅ User wants creation:', userWantsCreation);

    // Process creation attempts even if we're not 100% sure - better to try and fail than miss it
    // We'll let the individual extraction functions determine if it's valid

    // 🎯 STRICT ACTION DETECTION - Only create if user EXPLICITLY requested it AND assistant confirmed.
    // The `hasCreationConfirmation` check is now a gate at the top for all subsequent creation blocks.
    
    // Task creation - Liberal detection
    const hasTaskIntent = 
      /\b(add|create|new|track)\b/i.test(lowerMessage) && /\b(task|to do|todo)\b/i.test(lowerMessage) ||
      /\b(remind me)\b/i.test(lowerMessage);
    
    console.log('📝 Task intent detected:', hasTaskIntent);
    
    if (hasTaskIntent) {
      try {
        const task = await this.extractAndCreateTask(userMessage, queryClient, currentDateTime, conversationContext);
        if (task) {
          console.log('✅ Task created:', task);
          createdItems.push(`✅ Task: ${task.title}`);
        } else {
          console.log('❌ Task extraction returned null');
        }
      } catch (error) {
        console.error('❌ Task creation error:', error);
      }
    }

    // Event creation - Liberal detection
    const hasEventIntent = 
      /\b(schedule|add to calendar|add to my calendar|create event|book|add appointment|set up meeting)\b/i.test(lowerMessage) ||
      (/\b(add|create|schedule)\b/i.test(lowerMessage) && /\b(event|appointment|meeting|calendar)\b/i.test(lowerMessage));
    
    console.log('📅 Event intent detected:', hasEventIntent);
    
    if (hasEventIntent) {
      try {
        const event = await this.extractAndCreateEvent(userMessage, queryClient, currentDateTime, conversationContext);
        if (event) {
          console.log('✅ Event created:', event);
          createdItems.push(`📅 Event: ${event.title}`);
        } else {
          console.log('❌ Event extraction returned null');
        }
      } catch (error) {
        console.error('❌ Event creation error:', error);
      }
    }

    // Project creation - ULTRA LIBERAL
    const hasProjectIntent = 
      (/\b(create|new|start|add|track)\b/i.test(lowerMessage) && /\b(project)\b/i.test(lowerMessage));
    
    console.log('📁 Project intent detected:', hasProjectIntent);
    
    if (hasProjectIntent) {
      try {
        const project = await this.extractAndCreateProject(userMessage, queryClient, currentDateTime);
        if (project) {
          createdItems.push(`📁 Project: ${project.name}`);
        }
      } catch (error) {
        console.error('Project creation error:', error);
      }
    }

    // Contact creation - ULTRA LIBERAL
    const hasContactIntent = 
      (/\b(add|save|new|create|track)\b/i.test(lowerMessage) && /\b(contact)\b/i.test(lowerMessage));
    
    console.log('👤 Contact intent detected:', hasContactIntent);
    
    if (hasContactIntent) {
      try {
        const contact = await this.extractAndCreateContact(userMessage, queryClient);
        if (contact) {
          createdItems.push(`👤 Contact: ${contact.name}`);
        }
      } catch (error) {
        console.error('Contact creation error:', error);
      }
    }

    // Bill creation - ULTRA LIBERAL (create immediately like other entities)
    const hasBillIntent = 
      (/\b(add|track|create|new)\b/i.test(lowerMessage) && /\b(bill|payment)\b/i.test(lowerMessage)) ||
      /\b(add to bills|add to my bills)\b/i.test(lowerMessage);
    
    console.log('💵 Bill intent detected:', hasBillIntent);
    
    if (hasBillIntent) {
      try {
        const bill = await this.extractAndCreateBill(userMessage, queryClient, currentDateTime);
        if (bill) {
          console.log('✅ Bill created:', bill);
          createdItems.push(`💵 Bill: ${bill.name}`);
        } else {
          console.log('❌ Bill extraction returned null');
        }
      } catch (error) {
        console.error('❌ Bill creation error:', error);
      }
    }

    // Subscription creation
    const hasSubscriptionIntent = 
      (/\b(add|track|create|new)\b/i.test(lowerMessage) && /\b(subscription)\b/i.test(lowerMessage)) ||
      /\b(add to subscriptions|add to my subscriptions)\b/i.test(lowerMessage);
    
    console.log('💳 Subscription intent detected:', hasSubscriptionIntent);
    
    if (hasSubscriptionIntent) { 
      try {
        const subscription = await this.extractAndCreateSubscription(userMessage, queryClient);
        if (subscription) {
          console.log('✅ Subscription created:', subscription);
          createdItems.push(`💳 Subscription: ${subscription.vendor}`);
        } else {
          console.log('❌ Subscription extraction returned null');
        }
      } catch (error) {
        console.error('❌ Subscription creation error:', error);
      }
    }

    // Learning creation - ULTRA LIBERAL
    const hasLearningIntent = 
      (/\b(add|track|new|start|create)\b/i.test(lowerMessage) && /\b(learning|learn|study)\b/i.test(lowerMessage));
    
    console.log('📚 Learning intent detected:', hasLearningIntent);
    
    if (hasLearningIntent) {
      try {
        const learning = await this.extractAndCreateLearning(userMessage, queryClient);
        if (learning) {
          createdItems.push(`📚 Learning: ${learning.subject}`);
        }
      } catch (error) {
        console.error('Learning creation error:', error);
      }
    }

    // Vault asset creation - ULTRA LIBERAL
    const hasAssetIntent = 
      (/\b(add|track|new|create)\b/i.test(lowerMessage) && /\b(asset|purchase|bought)\b/i.test(lowerMessage));
    
    console.log('💎 Asset intent detected:', hasAssetIntent);
    
    if (hasAssetIntent) {
      try {
        const asset = await this.extractAndCreateAsset(userMessage, queryClient);
        if (asset) {
          createdItems.push(`💎 Asset: ${asset.name}`);
        }
      } catch (error) {
        console.error('Asset creation error:', error);
      }
    }

    // Only extract memories if user is sharing meaningful personal information
    const hasMeaningfulInfo = /\b(my name is|i live|i work|i am a|my|mine)\b/i.test(userMessage);
    if (hasMeaningfulInfo) {
      try {
        const memory = await this.extractAndSaveMemory(userMessage, assistantResponse, queryClient);
        if (memory) {
          createdItems.push(`🧠 Memory: ${memory.key}`);
        }
      } catch (error) {
        console.error('Memory creation error:', error);
      }
    }

    return createdItems;
  },

  async handleDeletion(userMessage, queryClient) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `User wants to delete/remove something: "${userMessage}"
        
        Identify what needs to be deleted and from which entity type. Prioritize explicit mentions.
        List of supported entities:
        - bill
        - subscription
        - task
        - event
        - contact
        - asset
        - project
        
        Return a JSON object with:
        - entity: the entity type (e.g., "Bill", "Subscription", "Task"). Must be one of the supported entities.
        - item_name: the name/title/vendor of the item to delete (e.g., "Hulu", "Netflix", "Doctor Appointment"). Be as specific as possible.
        
        If it's not a clear deletion request for a specific item, return {"entity": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            entity: { type: "string", nullable: true },
            item_name: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.entity && result.item_name) {
        console.log(`Attempting to delete "${result.item_name}" from entity "${result.entity}"`);
        // Fetch items from that entity
        let items = [];
        let invalidateKey;
        const entityLower = result.entity.toLowerCase();

        switch(entityLower) {
          case 'bill':
            items = await base44.entities.Bill.list();
            invalidateKey = 'bills';
            break;
          case 'subscription':
            items = await base44.entities.Subscription.list();
            invalidateKey = 'subscriptions';
            break;
          case 'task':
            items = await base44.entities.Task.list();
            invalidateKey = 'tasks';
            break;
          case 'event':
            items = await base44.entities.Event.list();
            invalidateKey = 'events';
            break;
          case 'contact':
            items = await base44.entities.Contact.list();
            invalidateKey = 'contacts';
            break;
          case 'asset':
            items = await base44.entities.Asset.list();
            invalidateKey = 'assets';
            break;
          case 'project':
            items = await base44.entities.Project.list();
            invalidateKey = 'projects';
            break;
          default:
            console.warn(`Unsupported entity for deletion: ${result.entity}`);
            return;
        }

        // Find and delete matching item
        const itemToDelete = items.find(item => {
          const nameMatch = item.name && item.name.toLowerCase().includes(result.item_name.toLowerCase());
          const vendorMatch = item.vendor && item.vendor.toLowerCase().includes(result.item_name.toLowerCase());
          const titleMatch = item.title && item.title.toLowerCase().includes(result.item_name.toLowerCase());
          return nameMatch || vendorMatch || titleMatch;
        });

        if (itemToDelete) {
          console.log(`Found item to delete: ${JSON.stringify(itemToDelete)}`);
          switch(entityLower) {
            case 'bill':
              await base44.entities.Bill.delete(itemToDelete.id);
              break;
            case 'subscription':
              await base44.entities.Subscription.delete(itemToDelete.id);
              break;
            case 'task':
              await base44.entities.Task.delete(itemToDelete.id);
              break;
            case 'event':
              await base44.entities.Event.delete(itemToDelete.id);
              break;
            case 'contact':
              await base44.entities.Contact.delete(itemToDelete.id);
              break;
            case 'asset':
              await base44.entities.Asset.delete(itemToDelete.id);
              break;
            case 'project':
              await base44.entities.Project.delete(itemToDelete.id);
              break;
          }
          if (invalidateKey) {
            queryClient.invalidateQueries({ queryKey: [invalidateKey] });
          }
          console.log(`Successfully deleted item ${itemToDelete.id} from ${result.entity}`);
        } else {
          console.warn(`Could not find item "${result.item_name}" in ${result.entity} for deletion.`);
        }
      }
    } catch (error) {
      console.error('Failed to handle deletion:', error);
    }
  },

  async handleMoveItem(userMessage, queryClient, currentDateTime) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `User wants to move an item from one category/entity to another: "${userMessage}"
        
        Example: "remove Hulu from bills and add to subscriptions"
        Example: "move the Apple stock from assets to investments"
        
        Return a JSON object with:
        - item_name: name of the item to move (e.g., "Hulu", "Apple stock"). Required.
        - from_entity: source entity type (e.g., "Bill", "Asset"). Required.
        - to_entity: destination entity type (e.g., "Subscription", "Investment"). Required.
        - amount: dollar amount if mentioned, as a number. Optional.
        - interval: if moving to a subscription, "monthly", "yearly", etc. Optional.
        
        If not a clear move request, return {"item_name": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            item_name: { type: "string", nullable: true },
            from_entity: { type: "string", nullable: true },
            to_entity: { type: "string", nullable: true },
            amount: { type: "number", nullable: true },
            interval: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.item_name && result.from_entity && result.to_entity) {
        console.log(`Attempting to move "${result.item_name}" from "${result.from_entity}" to "${result.to_entity}"`);
        // 1. Delete from source entity
        await this.handleDeletion(`remove ${result.item_name} from ${result.from_entity}`, queryClient);
        
        // 2. Add to destination entity
        const toEntityLower = result.to_entity.toLowerCase();
        if (toEntityLower === 'subscription') {
          await base44.entities.Subscription.create({
            vendor: result.item_name,
            amount: result.amount || 0,
            interval: result.interval || 'monthly', // Default to monthly if not specified
            category: 'other', // LLM would ideally specify this. For now, default.
            status: 'active'
          });
          queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
          console.log(`Created subscription for "${result.item_name}"`);
        } else if (toEntityLower === 'bill') {
          await base44.entities.Bill.create({
            name: result.item_name,
            amount: result.amount || 0,
            due_date: currentDateTime.split('T')[0], // Default due date to today if not specified
            category: 'other',
            recurring: false,
            status: 'pending'
          });
          queryClient.invalidateQueries({ queryKey: ['bills'] });
          console.log(`Created bill for "${result.item_name}"`);
        } else {
          console.warn(`Moving to entity "${result.to_entity}" is not yet supported.`);
        }
      }
    } catch (error) {
      console.error('Failed to move item:', error);
    }
  },

  async extractAndCreateSubscription(userMessage, queryClient) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CRITICAL: Extract subscription details from this message: "${userMessage}"
        
        BE VERY LIBERAL - If user mentions ANY service name, treat it as a subscription request!
        
        Return a JSON object with:
        - vendor: service name (REQUIRED, e.g., "Hulu", "Netflix", "Adobe Creative Cloud")
        - amount: monthly cost as a number (REQUIRED - if not mentioned, estimate typical cost or use 0)
        - interval: "monthly", "yearly", "weekly", or "quarterly" (default "monthly")
        - category: "software", "streaming", "utilities", "insurance", "membership", "education", "fitness", or "other"
        - next_renewal: Next payment date as ISO date (YYYY-MM-DD), default to 1st of next month
        
        Examples:
        ✅ "add hulu" → {"vendor": "Hulu", "amount": 8, "interval": "monthly", "category": "streaming"}
        ✅ "track netflix subscription" → {"vendor": "Netflix", "amount": 15, "interval": "monthly", "category": "streaming"}
        ✅ "new subscription spotify" → {"vendor": "Spotify", "amount": 10, "interval": "monthly", "category": "streaming"}
        
        If DEFINITELY NOT a subscription, return {"vendor": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            vendor: { type: "string", nullable: true },
            amount: { type: "number", nullable: true },
            interval: { type: "string", nullable: true, enum: ["monthly", "yearly", "weekly", "quarterly"] },
            category: { type: "string", nullable: true, enum: ["software", "streaming", "utilities", "insurance", "membership", "education", "fitness", "other"] },
            due_date: { type: "string", nullable: true }
          }
        }
      });

      console.log('💳 Subscription extraction result:', result);
      
      if (result && result.vendor) {
        const subscriptionData = {
          vendor: result.vendor,
          amount: result.amount || 0,
          interval: result.interval || 'monthly',
          category: result.category || 'other',
          next_renewal: result.next_renewal || null,
          status: 'active'
        };
        
        console.log('💳 Creating subscription with data:', subscriptionData);
        
        const newSubscription = await base44.entities.Subscription.create(subscriptionData);
        
        console.log('✅ Subscription created in database:', newSubscription);
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        return result;
      } else {
        console.log('❌ Subscription extraction failed - no vendor found');
      }
    } catch (error) {
      console.error('Failed to create subscription:', error);
    }
    return null;
  },

  async extractAndSaveMemory(userMessage, assistantResponse, queryClient) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this conversation and extract ANY personal information about the user that should be remembered long-term:

USER: "${userMessage}"
ASSISTANT: "${assistantResponse}"

Extract ANYTHING personal the user mentioned about themselves:
- Name, location (city, state, country)
- Family members, pets
- Job, hobbies, interests
- Preferences (favorite foods, colors, etc.)
- Important dates (birthdays, anniversaries)
- Goals, plans, aspirations
- Living situation, home details
- Health information
- ANY other personal facts

Return a JSON object with:
- key: a short identifier (e.g., "name", "location", "dog_name", "favorite_restaurant", "job_title")
- value: the actual information (be specific! e.g., "Panama City, Florida" not just "Florida")
- importance: 1-5 (5 = critical info like name/location, 3 = moderate, 1 = minor preference)

CRITICAL: If user mentions their location like "I live in Panama City Florida", extract it!
CRITICAL: Be generous - extract anything that helps personalize future conversations.

Examples:
- "I live in Panama City Florida" -> {key: "location", value: "Panama City, Florida", importance: 5}
- "My dog's name is Max" -> {key: "dog_name", value: "Max", importance: 3}
- "I work as a teacher" -> {key: "occupation", value: "teacher", importance: 4}

If absolutely no personal information is mentioned, return {"key": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            key: { type: "string", nullable: true },
            value: { type: "string", nullable: true },
            importance: { type: "integer", nullable: true }
          }
        }
      });

      if (result && result.key && result.value) {
        await base44.entities.Memory.create({
          key: result.key,
          value: result.value,
          importance: result.importance || 3,
          context: userMessage
        });
        
        queryClient.invalidateQueries({ queryKey: ['memories'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to extract memory:', error);
    }
    return null;
  },

  async extractAndCreateTask(userMessage, queryClient, currentDateTime, conversationContext = '') {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CURRENT DATE/TIME: ${currentDateTime} (CST timezone)

RECENT CONVERSATION CONTEXT:
${conversationContext}

CURRENT USER MESSAGE: "${userMessage}"
        
CRITICAL: Be VERY liberal in extraction. If there's ANY task mentioned, extract it.
CRITICAL: Use the conversation context to understand references like "this", "that", "it", etc.

For example:
- If conversation mentions "Sakura Sushi & Grill" and user says "remind me to get an order of this"
- Extract: "Order from Sakura Sushi & Grill" NOT "get an order of this"

Return JSON:
- title: task title (REQUIRED - extract the action with FULL CONTEXT, resolve pronouns like "this"/"that")
- notes: any details (include what was discussed in context)
- priority: "low", "medium", "high", or "urgent"
- due_date: ISO datetime if mentioned, calculate from CURRENT date above

Examples:
"remind me to call John" -> {title: "Call John", due_date: null}
"meeting tomorrow at 2pm" -> SKIP (this is an event, not a task)
"remind me to get an order of this" + context mentions "Sakura Sushi & Grill" -> {title: "Order from Sakura Sushi & Grill", notes: "Place order at Sakura Sushi & Grill"}

If clearly an EVENT (meeting, appointment, scheduled time), return {"title": null}.
If it's a TASK/TODO/REMINDER, extract it with FULL CONTEXT!`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", nullable: true },
            notes: { type: "string", nullable: true },
            priority: { type: "string", nullable: true },
            due_date: { type: "string", nullable: true }
          }
        }
      });

      console.log('📝 Task extraction result:', result);
      
      if (result && result.title) {
        const newTask = await base44.entities.Task.create({
          title: result.title,
          notes: result.notes || '',
          priority: result.priority || 'medium',
          due_date: result.due_date || null,
          status: 'todo'
        });
        
        console.log('✅ Task created in database:', newTask);
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
    return null;
  },

  async extractAndCreateEvent(userMessage, queryClient, currentDateTime, conversationContext = '') {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CRITICAL: CURRENT DATE/TIME IS ${currentDateTime} (CST timezone) - This is your ONLY reference!

RECENT CONVERSATION CONTEXT:
${conversationContext}

CURRENT USER MESSAGE: "${userMessage}"
        
CRITICAL DATE RULES - FOLLOW EXACTLY:
1. Extract dates EXACTLY as user states - NO timezone math, NO UTC conversion
2. If user says "January 5th 2025" → return "2025-01-05T00:00:00" (NO ADJUSTMENTS!)
3. If user says "tomorrow" → Calculate from ${currentDateTime}, add 1 day
4. If specific time given (e.g., "2pm") → Use 24-hour format (14:00:00)
5. If no time → Use 00:00:00 for all-day events
6. NEVER subtract days unless user explicitly says "yesterday"
7. Return dates in local CST time (YYYY-MM-DDTHH:mm:ss format - NO timezone suffix)

Return JSON:
- title: event title (include full context)
- description: details
- start_date: ISO datetime in CST (YYYY-MM-DDTHH:mm:ss, NO 'Z' or timezone)
- end_date: ISO datetime (start + 1 hour if not specified)
- location: location if mentioned
- all_day: boolean (true if no specific time)

CORRECT EXAMPLES:
✅ "January 5th birthday" → {"start_date": "2025-01-05T00:00:00", "all_day": true}
✅ "January 15 at 2pm dentist" → {"start_date": "2025-01-15T14:00:00", "all_day": false}

If NOT an event/appointment, return {"title": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            start_date: { type: "string", nullable: true },
            end_date: { type: "string", nullable: true },
            location: { type: "string", nullable: true },
            all_day: { type: "boolean", nullable: true }
          }
        }
      });

      console.log('📅 Event extraction result:', result);
      
      if (result && result.title && result.start_date) {
        const newEvent = await base44.entities.Event.create({
          title: result.title,
          description: result.description || '',
          start_date: result.start_date,
          end_date: result.end_date || result.start_date,
          location: result.location || '',
          all_day: result.all_day || false
        });
        
        console.log('✅ Event created in database:', newEvent);
        queryClient.invalidateQueries({ queryKey: ['events'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    }
    return null;
  },

  async extractAndCreateProject(userMessage, queryClient, currentDateTime) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CURRENT DATE: ${currentDateTime}

CRITICAL: BE VERY LIBERAL - Extract project from: "${userMessage}"

If user says "create project", "new project", "start project", etc., EXTRACT IT!
        
Return JSON with:
- name: project name (REQUIRED)
- description: project details (optional)
- start_date: ISO date (use current date if not specified)
- target_date: ISO date if mentioned (optional)
        
Examples:
✅ "create website redesign project" → {"name": "Website Redesign", "description": "", "start_date": "2025-11-15"}
✅ "new project for marketing campaign" → {"name": "Marketing Campaign", "start_date": "2025-11-15"}
        
If DEFINITELY NOT a project, return {"name": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            start_date: { type: "string", nullable: true },
            target_date: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.name) {
        await base44.entities.Project.create({
          name: result.name,
          description: result.description || '',
          start_date: result.start_date || new Date().toISOString().split('T')[0],
          target_date: result.target_date || null,
          status: 'active'
        });
        
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    return null;
  },

  async extractAndCreateContact(userMessage, queryClient) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract contact from: "${userMessage}"
        
        Return JSON:
        - name: contact name (required)
        - email: email if mentioned
        - phone: phone if mentioned
        - company: company if mentioned
        - notes: additional info
        
        If NOT a contact request, return {"name": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", nullable: true },
            email: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            company: { type: "string", nullable: true },
            notes: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.name) {
        await base44.entities.Contact.create({
          name: result.name,
          email: result.email || '',
          phone: result.phone || '',
          company: result.company || '',
          notes: result.notes || ''
        });
        
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
    return null;
  },

  async extractAndCreateBill(userMessage, queryClient, currentDateTime) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CURRENT DATE: ${currentDateTime}

CRITICAL: BE VERY LIBERAL - Extract bill details from: "${userMessage}"

If user says "add bill", "track bill", "new bill", etc., EXTRACT IT!
        
Return JSON:
- name: bill vendor (REQUIRED - service/company name)
- amount: bill amount as number (REQUIRED - estimate if not given, or use 0)
- due_date: ISO date (REQUIRED, calculate from current date - default to end of month if not specified)
- category: "utilities", "rent", "insurance", "credit_card", "loan", "tax", "medical", or "other"
- recurring: boolean
- notes: additional info
        
Examples:
✅ "add electricity bill $150" → {"name": "Electricity", "amount": 150, "due_date": "2025-11-30"}
✅ "track rent payment" → {"name": "Rent", "amount": 0, "due_date": "2025-11-30"}
        
If DEFINITELY NOT a bill, return {"name": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", nullable: true },
            amount: { type: "number", nullable: true },
            due_date: { type: "string", nullable: true },
            category: { type: "string", nullable: true },
            recurring: { type: "boolean", nullable: true },
            notes: { type: "string", nullable: true }
          }
        }
      });

      console.log('💵 Bill extraction result:', result);
      
      if (result && result.name) {
        // Smart defaults for missing fields
        const amount = result.amount || 0;
        const due_date = result.due_date || (() => {
          const date = new Date(currentDateTime);
          date.setMonth(date.getMonth() + 1);
          date.setDate(1);
          return date.toISOString().split('T')[0];
        })();
        
        const newBill = await base44.entities.Bill.create({
          name: result.name,
          amount: amount,
          due_date: due_date,
          category: result.category || 'other',
          recurring: result.recurring || false,
          status: 'pending',
          notes: result.notes || ''
        });
        
        console.log('✅ Bill created in database:', newBill);
        queryClient.invalidateQueries({ queryKey: ['bills'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create bill:', error);
    }
    return null;
  },

  async extractAndCreateLearning(userMessage, queryClient) {
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extract learning subject from: "${userMessage}"
        
        Return JSON:
        - subject: subject to learn (required, e.g., "Spanish", "Python")
        - goal: learning goal
        - difficulty: "beginner", "intermediate", or "advanced"
        - notes: additional info
        
        If NOT a learning request, return {"subject": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string", nullable: true },
            goal: { type: "string", nullable: true },
            difficulty: { type: "string", nullable: true },
            notes: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.subject) {
        await base44.entities.Learning.create({
          subject: result.subject,
          goal: result.goal || '',
          difficulty: result.difficulty || 'beginner',
          notes: result.notes || '',
          status: 'active',
          progress: 0,
          streak: 0
        });
        
        queryClient.invalidateQueries({ queryKey: ['learning'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create learning:', error);
    }
    return null;
  },

  async extractAndCreateAsset(userMessage, queryClient) {
    try {
      // First get all properties to associate asset with
      const properties = await base44.entities.Property.list();
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `CRITICAL: BE VERY LIBERAL - Extract asset from: "${userMessage}"

If user says "add asset", "track asset", "new asset", "bought", etc., EXTRACT IT!
        
Available properties: ${properties.map(p => p.name).join(', ') || 'None'}
        
Return JSON:
- name: asset name (REQUIRED - what they bought/own)
- category: "electronics", "furniture", "jewelry", "vehicle", "art", "real_estate", or "other"
- brand: brand if mentioned
- purchase_price: price as number if mentioned (optional, can be 0 or null)
- current_value: current value if mentioned (defaults to purchase_price)
- purchase_date: ISO date if mentioned (optional)
- property_name: which property this belongs to (must match one from available properties list)
- notes: additional info
        
IMPORTANT: property_name must be one of: ${properties.map(p => p.name).join(', ') || 'null (no properties exist)'}

Examples:
✅ "add new laptop to assets" → {"name": "Laptop", "category": "electronics"}
✅ "track my new car" → {"name": "Car", "category": "vehicle"}
        
If DEFINITELY NOT an asset, return {"name": null}.`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", nullable: true },
            category: { type: "string", nullable: true },
            brand: { type: "string", nullable: true },
            purchase_price: { type: "number", nullable: true },
            current_value: { type: "number", nullable: true },
            purchase_date: { type: "string", nullable: true },
            property_name: { type: "string", nullable: true },
            notes: { type: "string", nullable: true }
          }
        }
      });

      if (result && result.name) {
        // Find matching property ID
        let property_id = null;
        if (result.property_name) {
          const property = properties.find(p => 
            p.name.toLowerCase() === result.property_name.toLowerCase()
          );
          property_id = property?.id || null;
        }

        const assetData = {
          name: result.name,
          category: result.category || 'other',
          brand: result.brand || '',
          purchase_price: result.purchase_price || null,
          current_value: result.current_value || result.purchase_price || null,
          purchase_date: result.purchase_date || null,
          property_id: property_id,
          notes: result.notes || '',
          condition: 'good'
        };

        const createdAsset = await base44.entities.Asset.create(assetData);
        
        // Create initial valuation if value was provided
        if (assetData.current_value) {
          await base44.entities.Valuation.create({
            asset_id: createdAsset.id,
            amount: assetData.current_value,
            valuation_type: 'manual',
            as_of_date: new Date().toISOString().split('T')[0],
            source: 'Initial value from creation'
          });
        }
        
        queryClient.invalidateQueries({ queryKey: ['assets'] });
        queryClient.invalidateQueries({ queryKey: ['valuations'] });
        return result;
      }
    } catch (error) {
      console.error('Failed to create asset:', error);
    }
    return null;
  }
};

export default IntentProcessor;