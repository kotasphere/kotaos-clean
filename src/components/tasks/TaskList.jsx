import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, CheckCircle, Circle, Clock, Sparkles, Loader2, MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import TaskChatDialog from "./TaskChatDialog";

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  urgent: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
};

const statusColors = {
  todo: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
};

export default function TaskList({ tasks, projects, onEdit, onDelete, onStatusChange, isLoading }) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const handleAskAI = async (task) => {
    setSelectedTask(task);
    setAiDialogOpen(true);
    setIsAsking(true);
    setAiResponse("");

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a productivity expert helping someone execute this specific task efficiently. Focus on practical execution strategies.

Task Details:
- Title: ${task.title}
- Notes: ${task.notes || 'None'}
- Priority: ${task.priority}
- Due Date: ${task.due_date ? format(new Date(task.due_date), 'PPP') : 'Not set'}
- Status: ${task.status}

Provide actionable productivity advice on:
1. **Break It Down**: How to break this task into 3-5 concrete action steps
2. **Time Estimate**: Realistic time needed and best time of day to do it
3. **Focus Strategy**: How to eliminate distractions and maintain focus
4. **Efficiency Hacks**: Specific shortcuts, tools, or methods to complete this faster
5. **Common Pitfalls**: What usually goes wrong with this type of task and how to avoid it

Be specific to THIS task. Focus on execution, efficiency, and getting it done.`,
      });

      setAiResponse(response);
    } catch (error) {
      console.error('AI assistance error:', error);
      setAiResponse("I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleOpenChat = (task) => {
    setSelectedTask(task);
    setChatDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tasks.map(task => {
          const project = projects.find(p => p.id === task.project_id);
          const collaboratorsList = task.collaborators
            ?.map(id => contacts.find(c => c.id === id))
            .filter(Boolean) || [];
          
          return (
            <div
              key={task.id}
              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => {
                      const newStatus = task.status === 'completed' ? 'todo' : 
                                      task.status === 'todo' ? 'in_progress' : 
                                      'completed';
                      onStatusChange(task, newStatus);
                    }}
                    className="mt-1"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 ${task.status === 'completed' ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className={statusColors[task.status]}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {project && (
                        <Badge variant="outline" className="text-xs">
                          {project.name}
                        </Badge>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {task.notes}
                      </p>
                    )}

                    {collaboratorsList.length > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <div className="flex -space-x-2">
                          {collaboratorsList.slice(0, 3).map(collab => (
                            <Avatar key={collab.id} className="w-6 h-6 border-2 border-white dark:border-gray-800">
                              <AvatarImage src={collab.avatar_url} />
                              <AvatarFallback className="text-xs">{collab.name[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                          {collaboratorsList.length > 3 && (
                            <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-800">
                              <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700">
                                +{collaboratorsList.length - 3}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {task.ai_assistant_enabled && (
                            <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600">
                              <AvatarFallback className="text-xs text-white">
                                <Sparkles className="w-3 h-3" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {collaboratorsList.length + (task.ai_assistant_enabled ? 1 : 0)} member{collaboratorsList.length + (task.ai_assistant_enabled ? 1 : 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  {collaboratorsList.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenChat(task)}
                      className="h-8 w-8 text-indigo-600 hover:text-indigo-700"
                      title="Open task chat"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAskAI(task)}
                    className="h-8 w-8"
                    title="Ask AI for help"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(task)}
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(task.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              AI Productivity Coach
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedTask && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                  {selectedTask.title}
                </h3>
                {selectedTask.notes && (
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {selectedTask.notes}
                  </p>
                )}
              </div>
            )}

            {isAsking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 dark:text-purple-400" />
              </div>
            ) : (
              <Textarea
                value={aiResponse}
                readOnly
                className="min-h-[300px] bg-gray-50 dark:bg-gray-900"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TaskChatDialog
        open={chatDialogOpen}
        onClose={() => {
          setChatDialogOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        contacts={contacts}
      />
    </>
  );
}