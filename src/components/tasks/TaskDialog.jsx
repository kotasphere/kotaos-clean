
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Sparkles, X } from "lucide-react";

// This is a placeholder function as it's not defined in the original file or outline.
// In a real application, this would typically come from a routing utility or context.
const createPageUrl = (pageName) => {
  switch (pageName) {
    case 'Tasks':
      return '/tasks'; // Assuming /tasks is the URL for the tasks page
    // Add other cases if needed based on application's routing
    default:
      return '/';
  }
};

export default function TaskDialog({ open, onClose, onSave, task, projects }) {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
    project_id: '',
    tags: [],
    collaborators: [],
    ai_assistant_enabled: false
  });

  const [tagInput, setTagInput] = useState('');
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [initialCollaborators, setInitialCollaborators] = useState([]);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        notes: task.notes || '',
        due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        project_id: task.project_id || '',
        tags: task.tags || [],
        collaborators: task.collaborators || [],
        ai_assistant_enabled: task.ai_assistant_enabled || false
      });
      setInitialCollaborators(task.collaborators || []);
    } else {
      setFormData({
        title: '',
        notes: '',
        due_date: '',
        priority: 'medium',
        status: 'todo',
        project_id: '',
        tags: [],
        collaborators: [],
        ai_assistant_enabled: false
      });
      setInitialCollaborators([]);
    }
  }, [task, open]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleToggleCollaborator = (contactId) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.includes(contactId)
        ? prev.collaborators.filter(id => id !== contactId)
        : [...prev.collaborators, contactId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    
    // Send notifications to newly added collaborators
    const newCollaborators = formData.collaborators.filter(
      id => !initialCollaborators.includes(id)
    );
    
    // Save the task first
    await onSave(formData);
    
    // Then send invitations if this is an existing task being updated
    // and there are new collaborators
    if (newCollaborators.length > 0 && task && user && user.id) {
      for (const contactId of newCollaborators) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact && contact.user_id) {
          try {
            await base44.entities.Notification.create({
              user_id: contact.user_id,
              type: 'task_invite',
              title: 'Task Assignment',
              message: `You've been assigned to task: "${formData.title}"`,
              from_user_id: user.id,
              action_required: true,
              action_type: 'accept_task',
              action_data: { task_id: task.id },
              action_url: createPageUrl('Tasks')
            });
          } catch (error) {
            console.error('Failed to send task invitation notification:', error);
          }
        }
      }
    }
  };

  const connectedContacts = contacts; // Show ALL contacts, not just connected ones

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Task details"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>No project</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                    #{tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <Label>Collaborators</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCollaborators(!showCollaborators)}
              >
                {formData.collaborators.length > 0 ? `${formData.collaborators.length} added` : 'Add'}
              </Button>
            </div>

            {showCollaborators && (
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                {connectedContacts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No contacts found.
                  </p>
                ) : (
                  connectedContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleCollaborator(contact.id)}
                      className={`w-full p-2 flex items-center gap-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        formData.collaborators.includes(contact.id) ? 'bg-purple-50 dark:bg-purple-950/30' : ''
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback>{contact.name ? contact.name[0] : '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1 text-left">{contact.name || contact.email}</span>
                      {formData.collaborators.includes(contact.id) && (
                        <Badge variant="secondary" className="text-xs">Added</Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <Label htmlFor="ai_enabled">AI Assistant</Label>
                <p className="text-xs text-gray-500">Let AI help manage this task</p>
              </div>
              <Switch
                id="ai_enabled"
                checked={formData.ai_assistant_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, ai_assistant_enabled: checked })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {task ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
