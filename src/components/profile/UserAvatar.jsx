import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";

// Badge rarity colors for avatar rings
const getRarityRing = (badgeCount) => {
  if (badgeCount === 0) return "";
  if (badgeCount >= 50) return "ring-4 ring-purple-500 ring-offset-2 shadow-lg shadow-purple-500/50 animate-pulse";
  if (badgeCount >= 35) return "ring-4 ring-orange-500 ring-offset-2 shadow-lg shadow-orange-500/50";
  if (badgeCount >= 20) return "ring-3 ring-blue-500 ring-offset-2 shadow-md shadow-blue-500/50";
  if (badgeCount >= 10) return "ring-3 ring-green-500 ring-offset-2 shadow-md shadow-green-500/50";
  return "ring-2 ring-gray-400 ring-offset-2";
};

export default function UserAvatar({ userId, size = "md", showCrown = true, className = "" }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // CRITICAL FIX: Use the CURRENT user's email/ID, not the passed userId
  const displayUserId = userId || currentUser?.id;
  const displayUserEmail = currentUser?.email;

  // CRITICAL: Fetch profile for the CURRENT logged-in user
  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile', displayUserId, displayUserEmail],
    queryFn: async () => {
      if (displayUserEmail && base44?.entities?.Profile) {
        const results = await base44.entities.Profile.filter({ created_by: displayUserEmail });
        return results;
      }
      return [];
    },
    enabled: !!displayUserEmail,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['userBadges', displayUserId],
    queryFn: async () => {
      if (!displayUserId) return [];
      return await base44.entities.Badge.filter({ user_id: displayUserId });
    },
    enabled: !!displayUserId,
  });

  const profile = profiles[0];
  const badgeCount = badges.length;
  const hasLegendBadge = badges.some(b => b.badge_type === 'legend');

  // Get the user's name initial
  const userInitial = profile?.username?.[0]?.toUpperCase() || 
                     currentUser?.full_name?.[0]?.toUpperCase() || 
                     currentUser?.email?.[0]?.toUpperCase() || 
                     'U';

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24"
  };

  const crownSizes = {
    xs: "w-3 h-3 -top-1",
    sm: "w-3 h-3 -top-1",
    md: "w-4 h-4 -top-2",
    lg: "w-5 h-5 -top-2",
    xl: "w-6 h-6 -top-3",
    "2xl": "w-8 h-8 -top-4"
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <Avatar className={`${sizeClasses[size]} ${getRarityRing(badgeCount)} transition-all duration-500`}>
        <AvatarImage src={profile?.avatar_url} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
          {userInitial}
        </AvatarFallback>
      </Avatar>
      {showCrown && hasLegendBadge && (
        <div className={`absolute ${crownSizes[size]} left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full p-1 shadow-lg animate-bounce z-10`}>
          <Crown className="w-full h-full text-yellow-900" />
        </div>
      )}
    </div>
  );
}