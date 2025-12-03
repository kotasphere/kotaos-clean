import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Smartphone } from "lucide-react";
import ContactDialog from "../components/contacts/ContactDialog";
import ContactList from "../components/contacts/ContactList";

export default function ContactsPage() {
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Contact.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!base44?.entities?.User) return [];
      try {
        return await base44.entities.User.list();
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  const createContact = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.email] }); // Invalidate with user email
      setShowContactDialog(false);
      setEditingContact(null);
    },
  });

  const updateContact = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.email] }); // Invalidate with user email
      setShowContactDialog(false);
      setEditingContact(null);
    },
  });

  const deleteContact = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.email] }); // Invalidate with user email
    },
  });

  const sendConnectionRequest = useMutation({
    mutationFn: async ({ contactId, contactUserId, contactName, contactEmail }) => {
      // Ensure user data is available before proceeding
      if (!user || !user.id || !user.email) {
        throw new Error('User information not available to send connection request.');
      }

      // Verify the contact actually has a user_id (is a KOTA OS user)
      if (!contactUserId) {
        throw new Error('This contact is not a KOTA OS user. Add their KOTA OS email to connect.');
      }

      // Get sender's name from profile for better display
      const senderProfile = await base44.entities.Profile.filter({ created_by: user.email });
      const senderName = senderProfile[0]?.username || user.full_name || user.email.split('@')[0];

      // Create notification for the recipient
      await base44.entities.Notification.create({
        user_id: contactUserId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${senderName} wants to connect with you on KOTA OS`,
        action_required: true,
        action_type: 'accept_connection',
        action_data: {
          contact_id: contactId,
          from_user_id: user.id,
          from_user_email: user.email,
          from_user_name: senderName
        },
        from_user_id: user.id,
      });

      // Update contact status to pending
      await base44.entities.Contact.update(contactId, {
        connection_status: 'pending',
        connection_request_sent_by: user.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts', user?.email] });
      alert('✅ Connection request sent! They will receive a notification.');
    },
    onError: (error) => {
      console.error("Failed to send connection request:", error);
      alert(`❌ ${error.message || 'Failed to send connection request. Please try again.'}`);
    }
  });

  const handleCreateContact = () => {
    setEditingContact(null);
    setShowContactDialog(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowContactDialog(true);
  };

  const handleSaveContact = async (contactData) => {
    // Check if email matches a KOTA OS user (case-insensitive)
    // Only set user_id if it's not the current user's own contact entry and email matches another user
    const matchingUser = allUsers.find(u => 
      u.email?.toLowerCase() === contactData.email?.toLowerCase() && u.id !== user?.id
    );
    
    contactData.user_id = matchingUser ? matchingUser.id : null;

    let savedContact;

    if (editingContact) {
      await updateContact.mutateAsync({ id: editingContact.id, data: contactData });
      savedContact = { ...editingContact, ...contactData }; // Create updated object for subsequent checks
      
      // If user_id was just added/is present and not connected/pending, offer to send request
      if (savedContact.user_id && savedContact.connection_status !== 'connected' && savedContact.connection_status !== 'pending') {
        if (window.confirm(`${savedContact.name} is on KOTA OS! Send connection request to enable messaging?`)) {
          await sendConnectionRequest.mutateAsync({
            contactId: savedContact.id,
            contactUserId: savedContact.user_id,
            contactName: savedContact.name,
            contactEmail: savedContact.email
          });
        }
      }
    } else {
      savedContact = await createContact.mutateAsync(contactData);
      
      // If new contact is a KOTA OS user, offer to send connection request
      if (savedContact.user_id) {
        if (window.confirm(`${savedContact.name} is on KOTA OS! Send connection request to enable messaging?`)) {
          await sendConnectionRequest.mutateAsync({
            contactId: savedContact.id,
            contactUserId: savedContact.user_id,
            contactName: savedContact.name,
            contactEmail: savedContact.email
          });
        }
      }
    }
  };

  const handleImportContacts = async () => {
    // Check if we're on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      alert('📱 Contact Import from Phone\n\nThis feature only works on mobile devices.\n\n✅ To use:\n1. Open KOTA OS on your phone\n2. Use Chrome (Android) or Safari (iOS 14.5+)\n3. Click "Import from Phone" button\n4. Grant permission to access contacts\n\nFor now, you can add contacts manually.');
      return;
    }

    // Check if Contact Picker API is supported
    if (!('contacts' in navigator)) {
      alert('📱 Contact Picker Not Supported\n\nYour browser doesn\'t support the Contact Picker API yet.\n\n✅ Supported browsers:\n• Chrome/Edge on Android\n• Safari on iOS 14.5+\n\nPlease update your browser or add contacts manually.');
      return;
    }

    try {
      const props = ['name', 'email', 'tel'];
      const opts = { multiple: true };
      
      const selectedContacts = await navigator.contacts.select(props, opts);
      
      if (selectedContacts.length === 0) {
        return; // User cancelled
      }
      
      // Create contacts from selected phone contacts
      let successCount = 0;
      for (const contact of selectedContacts) {
        try {
          const contactData = {
            name: contact.name?.[0] || 'Unknown',
            email: contact.email?.[0] || '',
            phone: contact.tel?.[0] || '',
          };

          // Check if imported contact email matches a KOTA OS user (case-insensitive)
          const matchingUser = allUsers.find(u => 
            u.email?.toLowerCase() === contactData.email?.toLowerCase() && u.id !== user?.id
          );
          if (matchingUser) {
            contactData.user_id = matchingUser.id;
          }
          
          const newContact = await createContact.mutateAsync(contactData);
          successCount++;

          // If new imported contact is a KOTA OS user, offer to send connection request
          if (newContact.user_id) {
            if (window.confirm(`${newContact.name} is on KOTA OS! Send connection request to enable messaging?`)) {
              await sendConnectionRequest.mutateAsync({
                contactId: newContact.id,
                contactUserId: newContact.user_id,
                contactName: newContact.name
              });
            }
          }

        } catch (error) {
          console.error('Failed to create contact from import:', error);
        }
      }
      
      alert(`✅ Successfully imported ${successCount} contact${successCount !== 1 ? 's' : ''}!`);
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the picker
        return;
      }
      console.error('Contact picker error:', error);
      alert('❌ Failed to access contacts.\n\nPlease check:\n1. Browser permissions\n2. Device compatibility\n\nOr add contacts manually.');
    }
  };

  // Helper for URL creation, as it's not defined in the current file scope
  const createPageUrl = (pageName) => {
    // This is a placeholder. In a real app, this would typically use a router's `history.push` or `Link` component.
    // For "Messages", it's likely "/messages".
    return `/${pageName.toLowerCase()}`;
  };

  const handleContactAction = async (contact, action) => {
    if (action === 'connect') {
      if (!contact.user_id) {
        alert('❌ This contact is not on KOTA OS.\n\nTo connect:\n1. Make sure they have signed up for KOTA OS\n2. Update this contact with their exact KOTA OS email\n3. Try connecting again');
        return;
      }
      if (contact.connection_status === 'pending') {
        alert('⏳ Connection request already sent.\n\nWaiting for them to accept. They should have a notification in their bell icon.');
        return;
      }
      if (contact.connection_status === 'connected') {
        alert('✅ You are already connected!\n\nYou can message this contact from the Messages tab.');
        return;
      }
      
      try {
        await sendConnectionRequest.mutateAsync({
          contactId: contact.id,
          contactUserId: contact.user_id,
          contactName: contact.name,
          contactEmail: contact.email
        });
      } catch (error) {
        console.error('Connection error:', error);
      }
    } else if (action === 'message') {
      if (contact.connection_status !== 'connected') {
        alert('You must be connected to message this contact. Please send a connection request first.');
        return;
      }
      
      // Create or find existing conversation with this contact
      const conversationResponse = await base44.functions.invoke('createOrGetConversation', {
        contact_id: contact.id,
        contact_user_id: contact.user_id
      });
      
      if (conversationResponse.data.success) {
        window.location.href = createPageUrl('Messages');
      } else {
        alert('Failed to start conversation. Please try again.');
      }
    } else if (action === 'task') {
      alert(`Feature coming soon: Add ${contact.name} to a task`);
    } else if (action === 'project') {
      alert(`Feature coming soon: Add ${contact.name} to a project`);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-950 dark:to-indigo-950/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your connections</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleImportContacts}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Import from Phone</span>
              <span className="sm:hidden">Import</span>
            </Button>
            <Button
              onClick={handleCreateContact}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ContactList
            contacts={filteredContacts}
            onEdit={handleEditContact}
            onDelete={(id) => deleteContact.mutate(id)}
            onAction={handleContactAction}
            isLoading={isLoading}
          />
        </Card>

        <ContactDialog
          open={showContactDialog}
          onClose={() => {
            setShowContactDialog(false);
            setEditingContact(null);
          }}
          onSave={handleSaveContact}
          contact={editingContact}
        />
      </div>
    </div>
  );
}