import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FolderKanban, Plus, MessageSquare } from "lucide-react";
import ProjectDialog from "../components/projects/ProjectDialog";
import ProjectGrid from "../components/projects/ProjectGrid";
import ProjectChatDialog from "../components/projects/ProjectChatDialog";

export default function ProjectsPage() {
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [chatProject, setChatProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Project.filter({ created_by: user.email }, '-created_date');
    },
    enabled: !!user?.email,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Task.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.Contact.filter({ created_by: user.email });
    },
    enabled: !!user?.email,
  });

  const createProject = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectDialog(false);
      setEditingProject(null);
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowProjectDialog(false);
      setEditingProject(null);
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    setShowProjectDialog(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowProjectDialog(true);
  };

  const handleSaveProject = (projectData) => {
    if (editingProject) {
      updateProject.mutate({ id: editingProject.id, data: projectData });
    } else {
      createProject.mutate(projectData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-950 dark:to-indigo-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
              <p className="text-gray-500 dark:text-gray-400">Manage your projects</p>
            </div>
          </div>
          <Button
            onClick={handleCreateProject}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        <Card className="p-6">
          <ProjectGrid
            projects={projects}
            tasks={tasks}
            contacts={contacts}
            onEdit={handleEditProject}
            onDelete={(id) => deleteProject.mutate(id)}
            onChat={setChatProject}
            isLoading={isLoading}
          />
        </Card>

        <ProjectDialog
          open={showProjectDialog}
          onClose={() => {
            setShowProjectDialog(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
          project={editingProject}
        />

        <ProjectChatDialog
          project={chatProject}
          open={!!chatProject}
          onClose={() => setChatProject(null)}
        />
      </div>
    </div>
  );
}