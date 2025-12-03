import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Calendar, TrendingUp, Package } from "lucide-react";

export default function SubscriptionStats({ subscriptions }) {
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  
  const monthlyTotal = activeSubscriptions
    .filter(s => s.interval === 'monthly')
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const yearlyTotal = activeSubscriptions
    .filter(s => s.interval === 'yearly')
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  
  const totalMonthlyEquivalent = monthlyTotal + (yearlyTotal / 12);
  const annualTotal = totalMonthlyEquivalent * 12;

  const stats = [
    { 
      label: 'Monthly Cost', 
      value: `$${totalMonthlyEquivalent.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-cyan-600 dark:text-cyan-400', 
      bg: 'bg-cyan-50 dark:bg-cyan-950' 
    },
    { 
      label: 'Annual Cost', 
      value: `$${annualTotal.toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-950' 
    },
    { 
      label: 'Active Subs', 
      value: activeSubscriptions.length, 
      icon: Package, 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-50 dark:bg-green-950' 
    },
    { 
      label: 'Next Renewal', 
      value: subscriptions.length > 0 && subscriptions[0].next_renewal 
        ? new Date(subscriptions[0].next_renewal).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'None', 
      icon: Calendar, 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-50 dark:bg-purple-950' 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}