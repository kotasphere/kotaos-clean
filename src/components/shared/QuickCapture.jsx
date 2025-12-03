import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap, Loader2 } from "lucide-react";

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("task");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createItem = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (type === "task") {
        await base44.entities.Task.create({
          title: title.trim(),
          notes: notes.trim() || undefined,
          status: "todo",
          priority: "medium",
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        alert("✅ Task added!");
      } else if (type === "note") {
        await base44.entities.Conversation.create({
          role: "user",
          message: `📝 Note: ${title.trim()}\n${notes.trim()}`,
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        alert("📝 Note saved to Assistant!");
      } else if (type === "event") {
        await base44.entities.Event.create({
          title: title.trim(),
          description: notes.trim() || undefined,
          start_date: new Date().toISOString(),
          all_day: true,
        });
        queryClient.invalidateQueries({ queryKey: ['events'] });
        alert("📅 Event added!");
      } else if (type === "contact") {
        await base44.entities.Contact.create({
          name: title.trim(),
          notes: notes.trim() || undefined,
        });
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
        alert("👤 Contact added!");
      }

      setTitle("");
      setNotes("");
      setOpen(false);
    } catch (error) {
      console.error("Quick capture error:", error);
      alert("Failed to create item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      createItem();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group"
        style={{ 
          pointerEvents: 'auto',
          WebkitTapHighlightColor: 'transparent',
          willChange: 'transform'
        }}
        aria-label="Quick capture"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
      </button>

      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Allow closing
          setOpen(false);
          setTitle('');
          setNotes('');
        } else {
          setOpen(true);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              Quick Capture
            </DialogTitle>
            <DialogDescription>
              Capture your thoughts instantly. Press Cmd/Ctrl + Enter to save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">✅ Task</SelectItem>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="event">📅 Event</SelectItem>
                <SelectItem value="contact">👤 Contact</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder={
                type === "task" ? "What needs to be done?" :
                type === "note" ? "Quick note title..." :
                type === "event" ? "Event name..." :
                "Contact name..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            <Textarea
              placeholder="Additional details (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setTitle("");
                  setNotes("");
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={createItem}
                disabled={!title.trim() || isSubmitting}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Capture
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}