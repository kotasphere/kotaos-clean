
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckSquare, Plus, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskDialog from "../components/tasks/TaskDialog";
import TaskList from "../components/tasks/TaskList";
import TaskStats from "../components/tasks/TaskStats";

export default function TasksPage() {
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.email],
    queryFn: () => base44.entities.Task.filter({ created_by: user.email }, '-created_date'),
    initialData: [],
    enabled: !!user?.email, // Changed from !!user to !!user?.email
  });

  const { data: projects } = useQuery({
    queryKey: ['projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user?.email, // Changed from !!user to !!user?.email
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskDialog(false);
      setEditingTask(null);
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowTaskDialog(false);
      setEditingTask(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mark task notifications as read when visiting this page
  useEffect(() => {
    if (!user?.id || !base44?.entities?.Notification) return;
    
    base44.entities.Notification.filter({ user_id: user.id, type: 'task_invite', read: false })
      .then(notifications => {
        if (notifications && Array.isArray(notifications)) {
          notifications.forEach(n => {
            base44.entities.Notification.update(n.id, { read: true });
          });
        }
      })
      .catch(err => console.error('Failed to mark notifications as read:', err));
  }, [user?.id]);

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskDialog(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data: taskData });
    } else {
      createTask.mutate(taskData);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    updateTask.mutate({ id: task.id, data: { ...task, status: newStatus } });
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-950 dark:to-purple-950/30 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
              <p className="text-gray-500 dark:text-gray-400">Track your to-dos and projects</p>
            </div>
          </div>
          <Button
            onClick={handleCreateTask}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        <TaskStats tasks={tasks} />

        <Card className="p-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="todo">To Do</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Tabs value={priorityFilter} onValueChange={setPriorityFilter}>
              <TabsList>
                <TabsTrigger value="all">All Priority</TabsTrigger>
                <TabsTrigger value="urgent">Urgent</TabsTrigger>
                <TabsTrigger value="high">High</TabsTrigger>
                <TabsTrigger value="medium">Medium</TabsTrigger>
                <TabsTrigger value="low">Low</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <TaskList
            tasks={filteredTasks}
            projects={projects}
            onEdit={handleEditTask}
            onDelete={(id) => deleteTask.mutate(id)}
            onStatusChange={handleStatusChange}
            isLoading={isLoading}
          />
        </Card>

        <TaskDialog
          open={showTaskDialog}
          onClose={() => {
            setShowTaskDialog(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          task={editingTask}
          projects={projects}
        />
      </div>
    </div>
  );
}
