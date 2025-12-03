import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckSquare, Receipt, CreditCard, Loader2, Trash2, X } from "lucide-react";
import { format, isToday, isTomorrow, isPast, parseISO, startOfDay, addDays } from "date-fns";

export default function DailyPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Event.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: bills = [], isLoading: billsLoading } = useQuery({
    queryKey: ['bills', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Bill.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: subscriptions = [], isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['subscriptions', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Subscription.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const updateBill = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Bill.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  });

  const updateSubscription = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteBill = useMutation({
    mutationFn: (id) => base44.entities.Bill.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bills'] }),
  });

  const isLoading = tasksLoading || eventsLoading || billsLoading || subscriptionsLoading;

  // Filter items for today/upcoming
  const todayStart = startOfDay(selectedDate);
  const todayEnd = addDays(todayStart, 1);

  const todayTasks = tasks.filter(task => {
    if (task.status === 'cancelled' || task.status === 'completed') return false;
    if (!task.due_date) return false;
    const dueDate = parseISO(task.due_date);
    return dueDate >= todayStart && dueDate < todayEnd;
  });

  const todayEvents = events.filter(event => {
    const eventDate = parseISO(event.start_date);
    // Only show today's events
    return eventDate >= todayStart && eventDate < todayEnd;
  });

  const todayBills = bills.filter(bill => {
    if (bill.status === 'paid') return false;
    const dueDate = parseISO(bill.due_date);
    return dueDate >= todayStart && dueDate < todayEnd;
  });

  const upcomingSubscriptions = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    if (!sub.next_renewal) return true; // Show if no renewal date set
    const renewalDate = parseISO(sub.next_renewal);
    return renewalDate >= todayStart && renewalDate < addDays(todayStart, 7);
  });

  const handleTaskComplete = (task) => {
    updateTask.mutate({
      id: task.id,
      data: { status: task.status === 'completed' ? 'todo' : 'completed' }
    });
  };

  const handleBillComplete = (bill) => {
    updateBill.mutate({
      id: bill.id,
      data: { status: bill.status === 'paid' ? 'pending' : 'paid' }
    });
  };

  const handleSubscriptionToggle = (sub) => {
    updateSubscription.mutate({
      id: sub.id,
      data: { status: sub.status === 'active' ? 'cancelled' : 'active' }
    });
  };

  const getDateLabel = (date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalItems = todayTasks.length + todayEvents.length + todayBills.length + upcomingSubscriptions.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/20 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Daily To-Do
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getDateLabel(selectedDate)} - {totalItems} items
          </p>
        </div>

        {totalItems === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <CheckSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                All Clear!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No items scheduled for {getDateLabel(selectedDate).toLowerCase()}.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Tasks */}
          {todayTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  Tasks ({todayTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayTasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all group ${
                      task.status === 'completed'
                        ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        : 'bg-white dark:bg-gray-800 hover:shadow-md'
                    }`}
                  >
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => handleTaskComplete(task)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Due: {format(parseISO(task.due_date), 'h:mm a')}
                        </p>
                      )}
                    </div>
                    <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'secondary'} className="flex-shrink-0">
                      {task.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this task?')) {
                          deleteTask.mutate(task.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Events */}
          {todayEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Events ({todayEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-gray-800 relative group"
                  >
                    <Calendar className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.all_day ? 'All day' : format(parseISO(event.start_date), 'h:mm a')}
                        {event.location && ` • ${event.location}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this event?')) {
                          deleteEvent.mutate(event.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bills */}
          {todayBills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-green-600" />
                  Bills ({todayBills.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayBills.map(bill => (
                  <div
                    key={bill.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all group ${
                      bill.status === 'paid'
                        ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        : 'bg-white dark:bg-gray-800 hover:shadow-md'
                    }`}
                  >
                    <Checkbox
                      checked={bill.status === 'paid'}
                      onCheckedChange={() => handleBillComplete(bill)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${bill.status === 'paid' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {bill.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Due: {format(parseISO(bill.due_date), 'MMM d')}
                      </p>
                    </div>
                    <Badge variant="outline" className="font-bold flex-shrink-0">
                      ${bill.amount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (window.confirm('Delete this bill?')) {
                          deleteBill.mutate(bill.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Subscriptions */}
          {upcomingSubscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                  Upcoming Renewals ({upcomingSubscriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      sub.status === 'cancelled'
                        ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        : 'bg-white dark:bg-gray-800'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className={`font-medium ${sub.status === 'cancelled' ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                        {sub.vendor}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${sub.amount}/{sub.interval}
                        {sub.next_renewal && ` • Renews ${format(parseISO(sub.next_renewal), 'MMM d')}`}
                      </p>
                    </div>
                    <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}