import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import EventDialog from "../components/calendar/EventDialog";
import EventList from "../components/calendar/EventList";
import MonthGrid from "../components/calendar/MonthGrid";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', user?.email],
    queryFn: () => base44.entities.Event.filter({ created_by: user.email }, '-start_date'),
    initialData: [],
    enabled: !!user?.email,
  });

  const createEvent = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventDialog(false);
      setEditingEvent(null);
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowEventDialog(false);
      setEditingEvent(null);
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  // When user clicks a date, just select it (don't open dialog)
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
  };

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createEvent.mutate(eventData);
    }
  };

  // Mark event notifications as read when visiting this page
  useEffect(() => {
    if (!user?.id || !base44?.entities?.Notification) return;
    
    base44.entities.Notification.filter({ user_id: user.id, type: 'event_reminder', read: false })
      .then(notifications => {
        if (notifications && Array.isArray(notifications)) {
          notifications.forEach(n => {
            base44.entities.Notification.update(n.id, { read: true });
          });
        }
      })
      .catch(err => console.error('Failed to mark notifications as read:', err));
  }, [user?.id]);

  const eventsForSelectedDate = events.filter(event => 
    isSameDay(new Date(event.start_date), selectedDate)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your schedule</p>
            </div>
          </div>
          <Button
            onClick={handleCreateEvent}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <MonthGrid
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events}
              onDateSelect={handleDateSelect}
              onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
              onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
              onToday={() => {
                setCurrentDate(new Date());
                setSelectedDate(new Date());
              }}
            />
          </Card>

          <div className="space-y-4">
            <EventList
              selectedDate={selectedDate}
              events={eventsForSelectedDate}
              onEdit={handleEditEvent}
              onDelete={(id) => deleteEvent.mutate(id)}
            />
          </div>
        </div>

        <EventDialog
          open={showEventDialog}
          onClose={() => {
            setShowEventDialog(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          event={editingEvent}
          initialDate={selectedDate}
        />
      </div>
    </div>
  );
}