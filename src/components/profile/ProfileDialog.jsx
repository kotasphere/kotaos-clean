import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Flame, Calendar as CalendarIcon, Crown, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Badge rarity colors for avatar rings
const getRarityRing = (badgeCount) => {
  if (badgeCount === 0) return "";
  if (badgeCount >= 50) return "ring-8 ring-purple-500 ring-offset-8 shadow-2xl shadow-purple-500/50 animate-pulse"; // Legendary (50+)
  if (badgeCount >= 35) return "ring-8 ring-orange-500 ring-offset-8 shadow-2xl shadow-orange-500/50";  // Epic (35-49)
  if (badgeCount >= 20) return "ring-6 ring-blue-500 ring-offset-6 shadow-xl shadow-blue-500/50";    // Rare (20-34)
  if (badgeCount >= 10) return "ring-6 ring-green-500 ring-offset-6 shadow-lg shadow-green-500/50";   // Uncommon (10-19)
  return "ring-4 ring-gray-400 ring-offset-4";                          // Common (1-9)
};

const getRarityLabel = (badgeCount) => {
  if (badgeCount >= 50) return { label: "Legendary Collector", color: "text-purple-600 dark:text-purple-400", glow: "bg-purple-100 dark:bg-purple-950" };
  if (badgeCount >= 35) return { label: "Epic Achiever", color: "text-orange-600 dark:text-orange-400", glow: "bg-orange-100 dark:bg-orange-950" };
  if (badgeCount >= 20) return { label: "Rare Collector", color: "text-blue-600 dark:text-blue-400", glow: "bg-blue-100 dark:bg-blue-950" };
  if (badgeCount >= 10) return { label: "Uncommon User", color: "text-green-600 dark:text-green-400", glow: "bg-green-100 dark:bg-green-950" };
  if (badgeCount > 0) return { label: "Badge Collector", color: "text-gray-600 dark:text-gray-400", glow: "bg-gray-100 dark:bg-gray-800" };
  return { label: "New User", color: "text-gray-500 dark:text-gray-500", glow: "bg-gray-50 dark:bg-gray-900" };
};

const getRarityBadgeColor = (rarity) => {
  switch (rarity) {
    case 'legendary': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400 border-purple-300 dark:border-purple-700';
    case 'epic': return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400 border-orange-300 dark:border-orange-700';
    case 'rare': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400 border-blue-300 dark:border-blue-700';
    case 'uncommon': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400 border-green-300 dark:border-green-700';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-600';
  }
};

export default function ProfileDialog({ open, onClose, userId }) {
  // CRITICAL FIX: Fetch the CURRENT user's data, not all profiles
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: open,
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ['userProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Profile.filter({ created_by: user.email });
    },
    enabled: !!user?.email && open,
  });

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Badge.filter({ user_id: user.id }, '-earned_date');
    },
    enabled: !!user?.id && open,
  });

  const profile = profiles[0];
  const badgeCount = badges.length;
  const rarity = getRarityLabel(badgeCount);
  const hasLegendBadge = badges.some(b => b.badge_type === 'legend');

  // Count badges by rarity for specialty display
  const badgesByRarity = badges.reduce((acc, badge) => {
    const r = badge.badge_rarity || 'common';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const isLoading = profilesLoading || badgesLoading;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* Avatar with Rarity Ring & Crown */}
            <div className="flex flex-col items-center relative">
              <div className={`relative ${getRarityRing(badgeCount)} transition-all duration-500`}>
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl">
                    {profile?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Crown for Legends */}
                {hasLegendBadge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 rounded-full p-2 shadow-lg animate-bounce">
                    <Crown className="w-6 h-6 text-yellow-900" />
                  </div>
                )}
              </div>
              
              {/* Rarity Badge */}
              {badgeCount > 0 && (
                <div className={`mt-3 px-4 py-2 rounded-full border-2 ${rarity.glow}`}>
                  <p className={`text-sm font-bold ${rarity.color}`}>{rarity.label}</p>
                </div>
              )}

              <h2 className="text-2xl font-bold mt-4 text-gray-900 dark:text-gray-100">
                {profile?.username || 'User'}
              </h2>
              {profile?.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 max-w-md">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Badge Specialty Summary */}
            {badgeCount > 0 && (
              <Card className={rarity.glow}>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Badge Collection</h3>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div>
                      <div className="w-8 h-8 bg-purple-500 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                        {badgesByRarity.legendary || 0}
                      </div>
                      <p className="text-purple-600 dark:text-purple-400">Legend</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 bg-orange-500 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                        {badgesByRarity.epic || 0}
                      </div>
                      <p className="text-orange-600 dark:text-orange-400">Epic</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                        {badgesByRarity.rare || 0}
                      </div>
                      <p className="text-blue-600 dark:text-blue-400">Rare</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 bg-green-500 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                        {badgesByRarity.uncommon || 0}
                      </div>
                      <p className="text-green-600 dark:text-green-400">Uncommon</p>
                    </div>
                    <div>
                      <div className="w-8 h-8 bg-gray-400 rounded-full mx-auto mb-1 flex items-center justify-center text-white font-bold">
                        {badgesByRarity.common || 0}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">Common</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-3 text-center">
                  <Trophy className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{badgeCount}</p>
                  <p className="text-xs text-gray-500">Badges</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Flame className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile?.referral_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">Referrals</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    {profile?.created_date ? format(new Date(profile.created_date), 'MMM yyyy') : 'Recent'}
                  </p>
                  <p className="text-xs text-gray-500">Joined</p>
                </CardContent>
              </Card>
            </div>

            {/* Badges Section */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Achievements ({badgeCount})
              </h3>
              
              {badgeCount === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No badges earned yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                  {badges.map(badge => (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 ${getRarityBadgeColor(badge.badge_rarity)} hover:shadow-lg transition-all group relative`}
                      title={badge.badge_description}
                    >
                      <div className="text-3xl mb-1">{badge.badge_icon}</div>
                      <p className="text-xs font-semibold text-center text-gray-900 dark:text-gray-100 line-clamp-2">
                        {badge.badge_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(badge.earned_date), 'MMM d')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Rarity Legend */}
              {badgeCount > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Avatar Ring System:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse" />
                      <span>Legendary (50+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500" />
                      <span>Epic (35-49)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500" />
                      <span>Rare (20-34)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <span>Uncommon (10-19)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      <span>👑 Legend Badge</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Plan Badge */}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {profile?.plan || 'free'} plan
              </Badge>
              {profile?.signup_number && profile.signup_number <= 100 && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1">
                  Early Adopter #{profile.signup_number}
                </Badge>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}