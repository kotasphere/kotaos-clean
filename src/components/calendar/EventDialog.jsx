import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function EventDialog({ open, onClose, onSave, event, initialDate }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    all_day: false,
    location: '',
    color: 'blue'
  });

  // CRITICAL FIX: Update form when dialog opens OR when initialDate changes
  useEffect(() => {
    if (!open) return; // Only update when dialog is actually open
    
    if (event) {
      // Editing existing event
      setFormData({
        title: event.title || '',
        description: event.description || '',
        start_date: event.start_date ? format(new Date(event.start_date), "yyyy-MM-dd'T'HH:mm") : '',
        end_date: event.end_date ? format(new Date(event.end_date), "yyyy-MM-dd'T'HH:mm") : '',
        all_day: event.all_day || false,
        location: event.location || '',
        color: event.color || 'blue'
      });
    } else {
      // Creating new event - use the selected date from calendar
      const useDate = initialDate || new Date();
      setFormData({
        title: '',
        description: '',
        start_date: format(useDate, "yyyy-MM-dd'T'HH:mm"),
        end_date: format(useDate, "yyyy-MM-dd'T'HH:mm"),
        all_day: false,
        location: '',
        color: 'blue'
      });
    }
  }, [event, initialDate, open]);  // MUST include initialDate so it updates when user clicks different dates

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'New Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="all_day"
              checked={formData.all_day}
              onCheckedChange={(checked) => setFormData({ ...formData, all_day: checked })}
            />
            <Label htmlFor="all_day">All day event</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start</Label>
              <Input
                id="start_date"
                type={formData.all_day ? "date" : "datetime-local"}
                value={formData.all_day ? formData.start_date.split('T')[0] : formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End</Label>
              <Input
                id="end_date"
                type={formData.all_day ? "date" : "datetime-local"}
                value={formData.all_day ? formData.end_date.split('T')[0] : formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Event location"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {event ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}