import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
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
import { Loader2, Sparkles } from "lucide-react";

export default function EmailDraftDialog({ open, onClose, onSave, draft }) {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    body: '',
    tone: 'professional'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (draft) {
      setFormData({
        to: draft.to || '',
        subject: draft.subject || '',
        body: draft.body || '',
        tone: draft.tone || 'professional'
      });
    } else {
      setFormData({
        to: '',
        subject: '',
        body: '',
        tone: 'professional'
      });
    }
  }, [draft, open]);

  const handleGenerateWithAI = async () => {
    if (!formData.subject.trim()) {
      alert('Please enter a subject first');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a ${formData.tone} email with the subject: "${formData.subject}"

${formData.body ? `Current draft:\n${formData.body}\n\nImprove and expand this draft.` : 'Create a complete email body.'}

Make it clear, professional, and ready to send. Include appropriate greeting and closing.`,
      });

      setFormData({ ...formData, body: result });
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.subject.trim() || !formData.body.trim()) return;
    onSave({ ...formData, status: 'draft' });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft ? 'Edit Draft' : 'New Email Draft'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="concise">Concise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Email Body *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating || !formData.subject.trim()}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Email content..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.subject.trim() || !formData.body.trim()}>
            {draft ? 'Update Draft' : 'Save Draft'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}