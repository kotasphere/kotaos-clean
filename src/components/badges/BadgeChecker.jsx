
import { base44 } from "@/api/base44Client";

const BADGE_DEFINITIONS = {
  // Legend & Early Adopter (Exclusive)
  legend: {
    name: "Legend",
    description: "One of the first 25 users to join KOTA OS",
    icon: "👑",
    rarity: "legendary",
    criteria: (data) => data.signupNumber <= 25
  },
  early_adopter: {
    name: "Early Adopter",
    description: "Joined within the first 100 users",
    icon: "🚀",
    rarity: "epic",
    criteria: (data) => data.signupNumber <= 100
  },

  // Task Badges (5 tiers)
  task_starter: {
    name: "Task Starter",
    description: "Created your first 5 tasks",
    icon: "📝",
    rarity: "common",
    criteria: (data) => data.taskCount >= 5
  },
  task_organizer: {
    name: "Task Organizer",
    description: "Created 25 tasks",
    icon: "📋",
    rarity: "uncommon",
    criteria: (data) => data.taskCount >= 25
  },
  task_master: {
    name: "Task Master",
    description: "Created 50 tasks",
    icon: "✅",
    rarity: "rare",
    criteria: (data) => data.taskCount >= 50
  },
  task_guru: {
    name: "Task Guru",
    description: "Created 100 tasks",
    icon: "🎯",
    rarity: "epic",
    criteria: (data) => data.taskCount >= 100
  },
  task_legend: {
    name: "Task Legend",
    description: "Created 250+ tasks - absolute master",
    icon: "👑",
    rarity: "legendary",
    criteria: (data) => data.taskCount >= 250
  },

  // Project Badges (5 tiers)
  project_beginner: {
    name: "Project Beginner",
    description: "Created your first 3 projects",
    icon: "📂",
    rarity: "common",
    criteria: (data) => data.projectCount >= 3
  },
  project_manager: {
    name: "Project Manager",
    description: "Created 10 projects",
    icon: "📁",
    rarity: "uncommon",
    criteria: (data) => data.projectCount >= 10
  },
  project_pro: {
    name: "Project Pro",
    description: "Created 25 projects",
    icon: "🗂️",
    rarity: "rare",
    criteria: (data) => data.projectCount >= 25
  },
  project_expert: {
    name: "Project Expert",
    description: "Created 50 projects",
    icon: "📊",
    rarity: "epic",
    criteria: (data) => data.projectCount >= 50
  },
  project_visionary: {
    name: "Project Visionary",
    description: "Created 100+ projects - ultimate planner",
    icon: "🎨",
    rarity: "legendary",
    criteria: (data) => data.projectCount >= 100
  },

  // Vault Badges (5 tiers)
  vault_starter: {
    name: "Vault Starter",
    description: "Added your first 5 assets",
    icon: "💎",
    rarity: "common",
    criteria: (data) => data.assetCount >= 5
  },
  vault_collector: {
    name: "Vault Collector",
    description: "Added 15 assets",
    icon: "🏆",
    rarity: "uncommon",
    criteria: (data) => data.assetCount >= 15
  },
  vault_keeper: {
    name: "Vault Keeper",
    description: "Added 30 assets",
    icon: "🔐",
    rarity: "rare",
    criteria: (data) => data.assetCount >= 30
  },
  vault_guardian: {
    name: "Vault Guardian",
    description: "Added 75 assets",
    icon: "🛡️",
    rarity: "epic",
    criteria: (data) => data.assetCount >= 75
  },
  vault_tycoon: {
    name: "Vault Tycoon",
    description: "Added 150+ assets - wealth master",
    icon: "💰",
    rarity: "legendary",
    criteria: (data) => data.assetCount >= 150
  },

  // Contact Badges (5 tiers)
  networker: {
    name: "Networker",
    description: "Added your first 5 contacts",
    icon: "👤",
    rarity: "common",
    criteria: (data) => data.contactCount >= 5
  },
  connector: {
    name: "Connector",
    description: "Added 15 contacts",
    icon: "👥",
    rarity: "uncommon",
    criteria: (data) => data.contactCount >= 15
  },
  social_butterfly: {
    name: "Social Butterfly",
    description: "Added 30 contacts",
    icon: "🦋",
    rarity: "rare",
    criteria: (data) => data.contactCount >= 30
  },
  community_builder: {
    name: "Community Builder",
    description: "Added 75 contacts",
    icon: "🌟",
    rarity: "epic",
    criteria: (data) => data.contactCount >= 75
  },
  network_master: {
    name: "Network Master",
    description: "Added 150+ contacts - ultimate connector",
    icon: "🌐",
    rarity: "legendary",
    criteria: (data) => data.contactCount >= 150
  },

  // Bills Badges (5 tiers)
  bill_tracker: {
    name: "Bill Tracker",
    description: "Tracked your first 5 bills",
    icon: "💳",
    rarity: "common",
    criteria: (data) => data.billCount >= 5
  },
  bill_organizer: {
    name: "Bill Organizer",
    description: "Tracked 15 bills",
    icon: "💵",
    rarity: "uncommon",
    criteria: (data) => data.billCount >= 15
  },
  bill_manager: {
    name: "Bill Manager",
    description: "Tracked 30 bills",
    icon: "💰",
    rarity: "rare",
    criteria: (data) => data.billCount >= 30
  },
  finance_pro: {
    name: "Finance Pro",
    description: "Tracked 75 bills",
    icon: "📈",
    rarity: "epic",
    criteria: (data) => data.billCount >= 75
  },
  finance_master: {
    name: "Finance Master",
    description: "Tracked 150+ bills - money expert",
    icon: "🏦",
    rarity: "legendary",
    criteria: (data) => data.billCount >= 150
  },

  // AI Assistant Badges (5 tiers)
  ai_curious: {
    name: "AI Curious",
    description: "Had 10 conversations with AI",
    icon: "🤖",
    rarity: "common",
    criteria: (data) => data.conversationCount >= 10
  },
  ai_friend: {
    name: "AI Friend",
    description: "Had 50 conversations with AI",
    icon: "💬",
    rarity: "uncommon",
    criteria: (data) => data.conversationCount >= 50
  },
  ai_enthusiast: {
    name: "AI Enthusiast",
    description: "Had 150 conversations with AI",
    icon: "🌟",
    rarity: "rare",
    criteria: (data) => data.conversationCount >= 150
  },
  ai_partner: {
    name: "AI Partner",
    description: "Had 500 conversations with AI",
    icon: "🤝",
    rarity: "epic",
    criteria: (data) => data.conversationCount >= 500
  },
  ai_visionary: {
    name: "AI Visionary",
    description: "Had 1000+ conversations - AI pioneer",
    icon: "🚀",
    rarity: "legendary",
    criteria: (data) => data.conversationCount >= 1000
  },

  // Streak Badges (5 tiers)
  streak_starter: {
    name: "Streak Starter",
    description: "Active for 3 consecutive days",
    icon: "🔥",
    rarity: "common",
    criteria: (data) => data.streakDays >= 3
  },
  week_warrior: {
    name: "Week Warrior",
    description: "Active for 7 consecutive days",
    icon: "💪",
    rarity: "uncommon",
    criteria: (data) => data.streakDays >= 7
  },
  consistency_king: {
    name: "Consistency King",
    description: "Active for 30 consecutive days",
    icon: "💎",
    rarity: "rare",
    criteria: (data) => data.streakDays >= 30
  },
  dedication_master: {
    name: "Dedication Master",
    description: "Active for 90 consecutive days",
    icon: "🏆",
    rarity: "epic",
    criteria: (data) => data.streakDays >= 90
  },
  eternal_champion: {
    name: "Eternal Champion",
    description: "Active for 365+ days - unstoppable!",
    icon: "👑",
    rarity: "legendary",
    criteria: (data) => data.streakDays >= 365
  },

  // Power User Badges (5 tiers)
  getting_started: {
    name: "Getting Started",
    description: "Created 25+ items across all features",
    icon: "⭐",
    rarity: "common",
    criteria: (data) => {
      const total = data.taskCount + data.projectCount + data.assetCount + 
                    data.contactCount + data.billCount + data.eventCount;
      return total >= 25;
    }
  },
  power_user: {
    name: "Power User",
    description: "Created 100+ items across all features",
    icon: "⚡",
    rarity: "uncommon",
    criteria: (data) => {
      const total = data.taskCount + data.projectCount + data.assetCount + 
                    data.contactCount + data.billCount + data.eventCount;
      return total >= 100;
    }
  },
  super_user: {
    name: "Super User",
    description: "Created 250+ items",
    icon: "🌟",
    rarity: "rare",
    criteria: (data) => {
      const total = data.taskCount + data.projectCount + data.assetCount + 
                    data.contactCount + data.billCount + data.eventCount;
      return total >= 250;
    }
  },
  ultra_user: {
    name: "Ultra User",
    description: "Created 500+ items",
    icon: "💫",
    rarity: "epic",
    criteria: (data) => {
      const total = data.taskCount + data.projectCount + data.assetCount + 
                    data.contactCount + data.billCount + data.eventCount;
      return total >= 500;
    }
  },
  kota_legend: {
    name: "KOTA Legend",
    description: "Created 1000+ items - absolute master",
    icon: "🎖️",
    rarity: "legendary",
    criteria: (data) => {
      const total = data.taskCount + data.projectCount + data.assetCount + 
                    data.contactCount + data.billCount + data.eventCount;
      return total >= 1000;
    }
  },

  // Organized Badge (uses multiple features)
  organized: {
    name: "Organized",
    description: "Used 5+ different features",
    icon: "📱",
    rarity: "uncommon",
    criteria: (data) => {
      const features = [
        data.taskCount > 0,
        data.projectCount > 0,
        data.assetCount > 0,
        data.contactCount > 0,
        data.billCount > 0,
        data.eventCount > 0,
        data.subscriptionCount > 0,
        data.emailDraftCount > 0
      ].filter(Boolean).length;
      return features >= 5;
    }
  },

  // Referral Badges (5 tiers)
  referral_starter: {
    name: "Referral Starter",
    description: "Referred your first friend",
    icon: "🎁",
    rarity: "common",
    criteria: (data) => data.referralCount >= 1
  },
  referral_advocate: {
    name: "Referral Advocate",
    description: "Referred 5 friends",
    icon: "📢",
    rarity: "uncommon",
    criteria: (data) => data.referralCount >= 5
  },
  referral_champion: {
    name: "Referral Champion",
    description: "Referred 15 friends",
    icon: "🏆",
    rarity: "rare",
    criteria: (data) => data.referralCount >= 15
  },
  referral_master: {
    name: "Referral Master",
    description: "Referred 50 friends",
    icon: "🌟",
    rarity: "epic",
    criteria: (data) => data.referralCount >= 50
  },
  referral_legend: {
    name: "Referral Legend",
    description: "Referred 100+ friends - ultimate ambassador",
    icon: "👑",
    rarity: "legendary",
    criteria: (data) => data.referralCount >= 100
  }
};

export async function checkAndAwardBadges(userId) {
  try {
    const [
      tasks,
      projects,
      assets,
      contacts,
      bills,
      events,
      subscriptions,
      emailDrafts,
      conversations,
      existingBadges,
      profile
    ] = await Promise.all([
      base44.entities.Task.list(),
      base44.entities.Project.list(),
      base44.entities.Asset.list(),
      base44.entities.Contact.list(),
      base44.entities.Bill.list(),
      base44.entities.Event.list(),
      base44.entities.Subscription.list(),
      base44.entities.EmailDraft.list(),
      base44.entities.Conversation.list(),
      base44.entities.Badge.filter({ user_id: userId }),
      base44.entities.Profile.list()
    ]);

    const userProfile = profile[0];
    const existingBadgeTypes = existingBadges.map(b => b.badge_type);

    const userData = {
      signupNumber: userProfile?.signup_number || 999999,
      taskCount: tasks.length,
      projectCount: projects.length,
      assetCount: assets.length,
      contactCount: contacts.length,
      billCount: bills.length,
      eventCount: events.length,
      subscriptionCount: subscriptions.length,
      emailDraftCount: emailDrafts.length,
      conversationCount: conversations.length,
      referralCount: userProfile?.referral_count || 0,
      streakDays: 0, // Calculate from activity logs
      activeDays: 5 // Placeholder - would track actual login days
    };

    const newBadges = [];
    for (const [badgeType, definition] of Object.entries(BADGE_DEFINITIONS)) {
      if (existingBadgeTypes.includes(badgeType)) continue;

      if (definition.criteria(userData)) {
        const badge = await base44.entities.Badge.create({
          user_id: userId,
          badge_type: badgeType,
          badge_name: definition.name,
          badge_description: definition.description,
          badge_icon: definition.icon,
          badge_rarity: definition.rarity,
          earned_date: new Date().toISOString(),
          criteria_met: userData,
          viewed: false // Mark as unviewed
        });
        newBadges.push(badge);
      }
    }

    return newBadges;
  } catch (error) {
    console.error('Badge checking error:', error);
    return [];
  }
}

export { BADGE_DEFINITIONS };
