
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export default function OnboardingDialog({ open, onClose, profile }) {
  const [aiName, setAiName] = useState("");
  const [username, setUsername] = useState(profile?.username || "");
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: (data) => {
      if (profile) {
        return base44.entities.Profile.update(profile.id, data);
      }
      return base44.entities.Profile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (aiName.trim() && username.trim()) {
      updateProfile.mutate({
        ai_name: aiName.trim(),
        username: username.trim(),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <DialogTitle>Welcome to KOTA OS</DialogTitle>
          </div>
          <DialogDescription>
            Let's personalize your experience. What would you like to call your AI assistant?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aiName">AI Assistant Name</Label>
            <Input
              id="aiName"
              placeholder="e.g., Nova, Atlas, Sage..."
              value={aiName}
              onChange={(e) => setAiName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <p className="text-xs text-gray-500">Choose any name you like!</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!aiName.trim() || !username.trim()}
            className="bg-gradient-to-r from-blue-500 to-purple-600"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
