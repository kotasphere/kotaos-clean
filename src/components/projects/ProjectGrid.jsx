import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, CheckSquare, Sparkles, Loader2, MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import ProjectChatDialog from "./ProjectChatDialog";

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  on_hold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
};

export default function ProjectGrid({ projects, tasks, onEdit, onDelete, isLoading, contacts = [] }) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [aiResponse, setAiResponse] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  const handleAskAI = async (project) => {
    setSelectedProject(project);
    setAiDialogOpen(true);
    setIsAsking(true);
    setAiResponse("");

    const projectTasks = tasks.filter(t => t.project_id === project.id);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a project management expert helping optimize this specific project's execution and efficiency.

Project Details:
- Name: ${project.name}
- Description: ${project.description || 'None'}
- Status: ${project.status}
- Start Date: ${project.start_date ? format(new Date(project.start_date), 'PPP') : 'Not set'}
- Target Date: ${project.target_date ? format(new Date(project.target_date), 'PPP') : 'Not set'}
- Tasks: ${projectTasks.length} tasks (${projectTasks.filter(t => t.status === 'completed').length} completed)

Provide actionable project management advice on:
1. **Project Efficiency**: How to streamline this project and eliminate wasted time
2. **Task Optimization**: Prioritization strategy for tasks - what to do first and why
3. **Timeline Reality Check**: Is the target realistic? How to adjust or accelerate
4. **Resource Allocation**: Best way to allocate time and energy across project tasks
5. **Risk Mitigation**: Potential blockers or risks specific to this project and how to handle them

Focus on practical execution strategies to get THIS project done efficiently.`
      });

      setAiResponse(response);
    } catch (error) {
      console.error('AI assistance error:', error);
      setAiResponse("I'm having trouble connecting right now. Please try again later.");
    } finally {
      setIsAsking(false);
    }
  };

  const handleOpenChat = (project) => {
    setSelectedProject(project);
    setChatDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No projects found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.project_id === project.id);
          const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
          const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
          const collaboratorsList = project.collaborators
            ?.map(id => contacts.find(c => c.id === id))
            .filter(Boolean) || [];

          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="outline" className={`${statusColors[project.status]} mt-2`}>
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {collaboratorsList.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenChat(project)}
                        className="h-7 w-7 text-indigo-600 hover:text-indigo-700"
                        title="Open project chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleAskAI(project)}
                      className="h-7 w-7"
                      title="Ask AI for help"
                    >
                      <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(project)}
                      className="h-7 w-7"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(project.id)}
                      className="h-7 w-7 text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {collaboratorsList.length > 0 && (
                  <div className="flex items-center gap-2">
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
                      {project.ai_assistant_enabled && (
                        <Avatar className="w-6 h-6 border-2 border-white dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600">
                          <AvatarFallback className="text-xs text-white">
                            <Sparkles className="w-3 h-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {collaboratorsList.length + (project.ai_assistant_enabled ? 1 : 0)} member{collaboratorsList.length + (project.ai_assistant_enabled ? 1 : 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-500">
                  <CheckSquare className="w-4 h-4" />
                  <span>{completedTasks}/{projectTasks.length} tasks</span>
                </div>

                {project.target_date && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Target: {format(new Date(project.target_date), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              AI Project Manager
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProject && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  {selectedProject.name}
                </h3>
                {selectedProject.description && (
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {selectedProject.description}
                  </p>
                )}
              </div>
            )}

            {isAsking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600 dark:text-orange-400" />
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

      <ProjectChatDialog
        open={chatDialogOpen}
        onClose={() => {
          setChatDialogOpen(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
        contacts={contacts}
      />
    </>
  );
}