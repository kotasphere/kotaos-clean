import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar } from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors = {
  software: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  streaming: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400",
  utilities: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  insurance: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  membership: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export default function SubscriptionList({ subscriptions, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No subscriptions tracked yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {subscriptions.map(sub => {
        const nextRenewal = sub.next_renewal ? new Date(sub.next_renewal) : null;
        const daysUntil = nextRenewal ? differenceInDays(nextRenewal, new Date()) : null;
        const isUpcoming = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0;

        return (
          <div
            key={sub.id}
            className={`p-4 rounded-lg border transition-colors ${
              sub.status === 'cancelled'
                ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-60'
                : isUpcoming
                ? 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-cyan-300 dark:hover:border-cyan-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {sub.vendor}
                  </h3>
                  <Badge variant="outline" className={categoryColors[sub.category]}>
                    {sub.category}
                  </Badge>
                  {sub.status !== 'active' && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                      {sub.status}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-lg text-cyan-600 dark:text-cyan-400">
                    ${sub.amount.toFixed(2)}/{sub.interval}
                  </span>
                  
                  {nextRenewal && sub.status === 'active' && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className={isUpcoming ? 'font-semibold text-yellow-700 dark:text-yellow-400' : ''}>
                        Renews {format(nextRenewal, 'MMM d, yyyy')}
                      </span>
                      {isUpcoming && (
                        <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                          ({daysUntil}d)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {sub.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-1">
                    {sub.notes}
                  </p>
                )}
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(sub)}
                  className="h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(sub.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}