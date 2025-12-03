import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle, UserPlus, MessageSquare, Receipt, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id, filter],
    queryFn: () => {
      if (filter === 'unread') {
        return base44.entities.Notification.filter({ user_id: user.id, read: false }, '-created_date');
      }
      return base44.entities.Notification.filter({ user_id: user.id }, '-created_date');
    },
    enabled: !!user,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const markAsRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleAcceptProjectInvite = useMutation({
    mutationFn: async (notification) => {
      const { project_id } = notification.action_data;
      const project = await base44.entities.Project.filter({ id: project_id });
      
      if (project && project[0]) {
        const updatedCollaborators = [...(project[0].collaborators || []), user.id];
        await base44.entities.Project.update(project_id, { collaborators: updatedCollaborators });
      }
      
      await base44.entities.Notification.update(notification.id, { completed: true, read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleAcceptTaskInvite = useMutation({
    mutationFn: async (notification) => {
      const { task_id } = notification.action_data;
      const task = await base44.entities.Task.filter({ id: task_id });
      
      if (task && task[0]) {
        const updatedCollaborators = [...(task[0].collaborators || []), user.id];
        await base44.entities.Task.update(task_id, { collaborators: updatedCollaborators });
      }
      
      await base44.entities.Notification.update(notification.id, { completed: true, read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDeclineInvite = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { completed: true, read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead.mutateAsync(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'project_invite': return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'task_invite': return <UserPlus className="w-5 h-5 text-indigo-600" />;
      case 'bill_due': return <Receipt className="w-5 h-5 text-red-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSenderName = (notification) => {
    if (!notification.from_user_id) return null;
    const contact = contacts.find(c => c.id === notification.from_user_id || c.user_id === notification.from_user_id);
    return contact?.name || 'Someone';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
              <p className="text-gray-500 dark:text-gray-400">Stay updated with your activities</p>
            </div>
          </div>
          {notifications.some(n => !n.read) && (
            <Button onClick={() => markAllAsRead.mutate()} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
        </div>

        <Card className="p-6">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notification => {
                const senderName = getSenderName(notification);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' 
                        : 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h3>
                            {senderName && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                from {senderName}
                              </p>
                            )}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {format(new Date(notification.created_date), 'MMM d, yyyy h:mm a')}
                        </p>

                        {notification.action_required && !notification.completed && (
                          <div className="flex gap-2 mt-3">
                            {notification.action_type === 'accept_project' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptProjectInvite.mutate(notification)}
                                  disabled={handleAcceptProjectInvite.isLoading}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineInvite.mutate(notification.id)}
                                  disabled={handleDeclineInvite.isLoading}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {notification.action_type === 'accept_task' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptTaskInvite.mutate(notification)}
                                  disabled={handleAcceptTaskInvite.isLoading}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeclineInvite.mutate(notification.id)}
                                  disabled={handleDeclineInvite.isLoading}
                                >
                                  Decline
                                </Button>
                              </>
                            )}
                            {notification.action_type === 'view_message' && (
                              <Button
                                size="sm"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                View Message
                              </Button>
                            )}
                            {notification.action_type === 'view_bill' && (
                              <Button
                                size="sm"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                View Bill
                              </Button>
                            )}
                          </div>
                        )}

                        {notification.completed && notification.action_required && (
                          <div className="flex items-center gap-2 mt-3 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Completed</span>
                          </div>
                        )}

                        {!notification.action_required && notification.action_url && !notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}