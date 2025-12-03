
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Plus } from "lucide-react";
import EmailDraftDialog from "../components/email/EmailDraftDialog";
import DraftList from "../components/email/DraftList";

export default function EmailDraftsPage() {
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['emailDrafts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.EmailDraft.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const createDraft = useMutation({
    mutationFn: (data) => base44.entities.EmailDraft.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDrafts'] });
      setShowDraftDialog(false);
      setEditingDraft(null);
    },
  });

  const updateDraft = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailDraft.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDrafts'] });
      setShowDraftDialog(false);
      setEditingDraft(null);
    },
  });

  const deleteDraft = useMutation({
    mutationFn: (id) => base44.entities.EmailDraft.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailDrafts'] });
    },
  });

  const sendEmail = useMutation({
    mutationFn: async (draft) => {
      await base44.integrations.Core.SendEmail({
        from_name: 'KOTA OS',
        to: draft.to,
        subject: draft.subject,
        body: draft.body,
      });
      return draft.id;
    },
    onSuccess: (draftId) => {
      updateDraft.mutate({
        id: draftId,
        data: { status: 'sent' }
      });
    },
  });

  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setShowDraftDialog(true);
  };

  const handleSaveDraft = (draftData) => {
    if (editingDraft) {
      updateDraft.mutate({ id: editingDraft.id, data: draftData });
    } else {
      createDraft.mutate(draftData);
    }
  };

  const handleSendEmail = async (draft) => {
    if (!draft.to || !draft.subject || !draft.body) {
      alert('Please fill in recipient, subject, and body before sending');
      return;
    }
    
    if (window.confirm(`Send email to ${draft.to}?`)) {
      try {
        await sendEmail.mutateAsync(draft);
        alert('Email sent successfully!');
      } catch (error) {
        console.error('Send error:', error);
        alert('Failed to send email. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-950 dark:to-blue-950/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Email Drafts</h1>
              <p className="text-gray-500 dark:text-gray-400">AI-powered email writing & sending</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingDraft(null);
              setShowDraftDialog(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Draft
          </Button>
        </div>

        <Card className="p-6">
          <DraftList
            drafts={drafts}
            onEdit={handleEditDraft}
            onDelete={(id) => deleteDraft.mutate(id)}
            onSend={handleSendEmail}
            isLoading={isLoading}
          />
        </Card>

        <EmailDraftDialog
          open={showDraftDialog}
          onClose={() => {
            setShowDraftDialog(false);
            setEditingDraft(null);
          }}
          onSave={handleSaveDraft}
          draft={editingDraft}
        />
      </div>
    </div>
  );
}
