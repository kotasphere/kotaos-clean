import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { isAfter, isBefore, addDays } from "date-fns";

export default function BillStats({ bills, onFilterChange }) {
  const today = new Date();
  
  const upcoming = bills.filter(b => b.status === 'pending' && isAfter(new Date(b.due_date), today));
  const overdue = bills.filter(b => b.status === 'pending' && isBefore(new Date(b.due_date), today));
  const dueSoon = bills.filter(b => {
    const dueDate = new Date(b.due_date);
    return b.status === 'pending' && isAfter(dueDate, today) && isBefore(dueDate, addDays(today, 7));
  });
  const paid = bills.filter(b => b.status === 'paid');

  const totalUpcoming = upcoming.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalPaid = paid.reduce((sum, b) => sum + (b.amount || 0), 0);

  const stats = [
    { 
      label: 'Overdue', 
      value: overdue.length,
      amount: overdue.reduce((sum, b) => sum + (b.amount || 0), 0),
      icon: AlertCircle, 
      color: 'text-red-600 dark:text-red-400', 
      bg: 'bg-red-50 dark:bg-red-950',
      clickable: true,
      filter: 'overdue'
    },
    { 
      label: 'Due This Week', 
      value: dueSoon.length,
      amount: dueSoon.reduce((sum, b) => sum + (b.amount || 0), 0),
      icon: Clock, 
      color: 'text-yellow-600 dark:text-yellow-400', 
      bg: 'bg-yellow-50 dark:bg-yellow-950',
      clickable: true,
      filter: 'pending'
    },
    { 
      label: 'Total Upcoming', 
      value: `$${totalUpcoming.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-teal-600 dark:text-teal-400', 
      bg: 'bg-teal-50 dark:bg-teal-950',
      clickable: true,
      filter: 'pending'
    },
    { 
      label: 'Total Paid', 
      value: `$${totalPaid.toFixed(2)}`, 
      icon: CheckCircle, 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-50 dark:bg-green-950',
      clickable: true,
      filter: 'paid'
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className={stat.clickable ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
          onClick={() => stat.clickable && onFilterChange && onFilterChange(stat.filter)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                {stat.amount > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ${stat.amount.toFixed(2)}
                  </p>
                )}
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