import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Trophy, Crown, Star } from "lucide-react";

const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'legendary': return 'from-purple-600 to-pink-600';
    case 'epic': return 'from-orange-500 to-red-600';
    case 'rare': return 'from-blue-500 to-indigo-600';
    case 'uncommon': return 'from-green-500 to-emerald-600';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getRarityIcon = (rarity) => {
  switch (rarity) {
    case 'legendary': return Crown;
    case 'epic': return Trophy;
    case 'rare': return Star;
    default: return Sparkles;
  }
};

export default function BadgeEarnedDialog({ badge, open, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (open && badge) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 3000);
    }
  }, [open, badge]);

  if (!badge) return null;

  const RarityIcon = getRarityIcon(badge.badge_rarity);
  const rarityColor = getRarityColor(badge.badge_rarity);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-4 border-yellow-400 bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950 overflow-hidden">
        {/* CSS Confetti Effect */}
        {isAnimating && (
          <>
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  backgroundColor: ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'][Math.floor(Math.random() * 6)],
                }}
              />
            ))}
          </>
        )}

        <div className="text-center py-6 relative z-10">
          {/* Animated Badge Icon */}
          <div className="relative inline-block mb-6">
            <div className={`absolute inset-0 blur-2xl opacity-50 bg-gradient-to-r ${rarityColor} rounded-full animate-pulse`} />
            <div className={`relative w-32 h-32 mx-auto bg-gradient-to-r ${rarityColor} rounded-full flex items-center justify-center shadow-2xl ${isAnimating ? 'animate-bounce' : ''}`}>
              <div className="text-6xl">{badge.badge_icon}</div>
            </div>
            {/* Sparkle effects */}
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-spin" />
            <Sparkles className="absolute -bottom-2 -left-2 w-6 h-6 text-yellow-400 animate-ping" />
            <RarityIcon className="absolute top-0 -left-4 w-10 h-10 text-yellow-500 animate-pulse" />
          </div>

          {/* Badge Info */}
          <div className="space-y-2 mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              🎉 Badge Earned! 🎉
            </h2>
            <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${rarityColor} text-white text-sm font-bold uppercase tracking-wider`}>
              {badge.badge_rarity}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">
              {badge.badge_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              {badge.badge_description}
            </p>
          </div>

          {/* Achievement Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border-2 border-yellow-300 dark:border-yellow-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🏆 Achievement Unlocked
            </p>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-600">
                {badge.badge_name}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={onClose}
            className={`bg-gradient-to-r ${rarityColor} hover:opacity-90 text-white font-bold px-8 py-6 text-lg`}
          >
            Awesome! 🎊
          </Button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Check your profile to see all your badges
          </p>
        </div>

        <style>{`
          .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            top: -10px;
            animation: confetti-fall 3s linear forwards;
            z-index: 5;
          }
          
          @keyframes confetti-fall {
            to {
              transform: translateY(500px) rotate(360deg);
              opacity: 0;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}