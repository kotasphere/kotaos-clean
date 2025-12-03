import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";

export default function BillCalendar({ bills, onEdit, onMarkPaid }) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getBillsForDay = (day) => {
    return bills.filter(bill => isSameDay(new Date(bill.due_date), day));
  };

  const getCategoryColor = (category) => {
    const colors = {
      utilities: 'bg-blue-500',
      rent: 'bg-purple-500',
      insurance: 'bg-red-500',
      credit_card: 'bg-orange-500',
      loan: 'bg-indigo-500',
      tax: 'bg-pink-500',
      medical: 'bg-green-500',
      other: 'bg-gray-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const dayBills = getBillsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const totalAmount = dayBills.reduce((sum, b) => sum + (b.amount || 0), 0);
          const paidBills = dayBills.filter(b => b.status === 'paid');
          const overdueBills = dayBills.filter(b => b.status === 'pending' && new Date(b.due_date) < new Date());

          return (
            <div
              key={day.toString()}
              className={`
                min-h-[120px] p-2 rounded-lg border transition-all
                ${!isCurrentMonth && 'opacity-40 bg-gray-50 dark:bg-gray-900'}
                ${isTodayDate && 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-950/30'}
                ${!isTodayDate && 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-semibold ${
                  isCurrentMonth ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </span>
                {dayBills.length > 0 && (
                  <Badge variant="outline" className="text-xs h-5">
                    {dayBills.length}
                  </Badge>
                )}
              </div>
              
              {dayBills.length > 0 && (
                <div className="space-y-1">
                  {dayBills.slice(0, 3).map((bill) => (
                    <button
                      key={bill.id}
                      onClick={() => onEdit(bill)}
                      className={`
                        w-full text-left px-2 py-1 rounded text-xs truncate transition-all
                        ${bill.status === 'paid' 
                          ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 line-through opacity-60' 
                          : overdueBills.includes(bill)
                          ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 animate-pulse'
                          : 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{bill.name}</span>
                        {bill.status === 'paid' && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                      </div>
                      <div className="font-semibold">${bill.amount}</div>
                    </button>
                  ))}
                  {dayBills.length > 3 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{dayBills.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-teal-100 dark:bg-teal-950 border border-teal-300 dark:border-teal-700" />
            <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700" />
            <span className="text-gray-600 dark:text-gray-400">Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700" />
            <span className="text-gray-600 dark:text-gray-400">Paid</span>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Click any bill to edit or mark as paid
        </div>
      </div>
    </div>
  );
}