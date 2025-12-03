
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Sparkles } from "lucide-react";

// Placeholder for createPageUrl - in a real application, this would typically be an imported utility
// or part of a routing library to generate correct navigation URLs.
const createPageUrl = (pageName) => {
  return `/${pageName.toLowerCase()}`;
};

export default function ProjectDialog({ open, onClose, onSave, project }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    color: 'blue',
    start_date: '',
    target_date: '',
    collaborators: [],
    ai_assistant_enabled: false
  });

  const [showCollaborators, setShowCollaborators] = useState(false);
  const [initialCollaborators, setInitialCollaborators] = useState([]); // Added state for initial collaborators

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  // Fetch current user details to use for 'from_user_id' in notifications
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        color: project.color || 'blue',
        start_date: project.start_date || '',
        target_date: project.target_date || '',
        collaborators: project.collaborators || [],
        ai_assistant_enabled: project.ai_assistant_enabled || false
      });
      setInitialCollaborators(project.collaborators || []); // Set initial collaborators from existing project
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'active',
        color: 'blue',
        start_date: '',
        target_date: '',
        collaborators: [],
        ai_assistant_enabled: false
      });
      setInitialCollaborators([]); // No initial collaborators for a new project
    }
  }, [project, open]);

  const handleToggleCollaborator = (contactId) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.includes(contactId)
        ? prev.collaborators.filter(id => id !== contactId)
        : [...prev.collaborators, contactId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    // Save the project first
    // Note: If this is a new project, 'project.id' might not be available for notifications
    // until 'onSave' completes and potentially returns the new project with its ID.
    // The current logic sends notifications only if 'project' prop (an existing project) is provided.
    await onSave(formData);
    
    // Send notifications to newly added collaborators
    const newCollaborators = formData.collaborators.filter(
      id => !initialCollaborators.includes(id)
    );
    
    // Then send invitations, only if editing an existing project and there are new collaborators
    // We check `project && project.id` to ensure we are editing an existing project,
    // and `user` to ensure we have the sender's ID.
    if (newCollaborators.length > 0 && project && project.id && user) {
      for (const contactId of newCollaborators) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact && contact.user_id) { // Ensure the contact has a user_id to send a notification to
          try {
            await base44.entities.Notification.create({
              user_id: contact.user_id,
              type: 'project_invite',
              title: 'Project Invitation',
              message: `You've been invited to collaborate on "${formData.name}"`,
              from_user_id: user.id, // Use the current user's ID
              action_required: true,
              action_type: 'accept_project',
              action_data: { project_id: project.id }, // Use the existing project's ID
              action_url: createPageUrl('Projects') // Generate URL for the projects page
            });
          } catch (error) {
            console.error('Failed to send notification for contact:', contact.id, error);
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
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project goals and details..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
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
                    No connected contacts. Add friends in Contacts tab.
                  </p>
                ) : (
                  connectedContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleToggleCollaborator(contact.id)}
                      className={`w-full p-2 flex items-center gap-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        formData.collaborators.includes(contact.id) ? 'bg-orange-50 dark:bg-orange-950/30' : ''
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback>{contact.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium flex-1 text-left">{contact.name}</span>
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
                <p className="text-xs text-gray-500">Let AI help manage this project</p>
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
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {project ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
