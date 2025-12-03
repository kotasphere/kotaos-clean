import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Building, Edit, Trash2, Users, MessageSquare, ListTodo, FolderKanban, MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContactList({ contacts, onEdit, onDelete, onAction, isLoading }) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No contacts found</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Add contacts manually or import from your phone
        </p>
      </div>
    );
  }

  const handleMessage = async (contact) => {
    // Check if contact has user_id and is connected
    if (!contact.user_id) {
      alert('❌ This contact is not on KOTA OS.\n\nTo message them:\n1. Make sure they\'ve signed up for KOTA OS\n2. Update their contact with their KOTA OS email\n3. Send a connection request');
      return;
    }
    
    if (contact.connection_status !== 'connected') {
      if (contact.connection_status === 'pending') {
        alert('⏳ Connection request pending.\n\nWait for them to accept before messaging.');
      } else {
        alert('🔗 Not connected yet!\n\nClick the "Connect" button (user icon) first to send a connection request.');
      }
      return;
    }
    
    // If onAction exists, use it (for proper conversation creation)
    if (onAction) {
      await onAction(contact, 'message');
    } else {
      // Fallback: just navigate to Messages
      navigate(createPageUrl("Messages"));
      sessionStorage.setItem('openContactMessage', contact.id);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {contacts.map(contact => (
        <div
          key={contact.id}
          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
        >
          <div className="flex items-start gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                {contact.name[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {contact.name}
              </h3>
              
              {contact.company && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Building className="w-3 h-3" />
                  <span className="truncate">{contact.company}</span>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{contact.email}</span>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <Phone className="w-3 h-3" />
                  <span>{contact.phone}</span>
                </div>
              )}
              
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {contact.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!contact.user_id && (
                    <DropdownMenuItem onClick={() => onAction && onAction(contact, 'connect')}>
                      <Users className="w-4 h-4 mr-2" />
                      {contact.connection_status === 'pending' ? 'Request Pending' : 'Connect'}
                    </DropdownMenuItem>
                  )}
                  {contact.user_id && contact.connection_status !== 'connected' && (
                    <DropdownMenuItem onClick={() => onAction && onAction(contact, 'connect')}>
                      <Users className="w-4 h-4 mr-2" />
                      {contact.connection_status === 'pending' ? 'Request Pending' : 'Send Connection Request'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => handleMessage(contact)}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {contact.connection_status === 'connected' ? 'Send Message' : 'Message (Not Connected)'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(createPageUrl("Tasks"))}>
                    <ListTodo className="w-4 h-4 mr-2" />
                    Add to Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(createPageUrl("Projects"))}>
                    <FolderKanban className="w-4 h-4 mr-2" />
                    Add to Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(contact)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(contact.id)}
                className="h-8 w-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}