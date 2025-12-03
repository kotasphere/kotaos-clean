
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, Flame, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LearningPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState(null);
  const [generatingLesson, setGeneratingLesson] = useState(false);
  const [newLearning, setNewLearning] = useState({
    subject: "",
    goal: "",
    difficulty: "beginner",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: learnings = [], isLoading } = useQuery({
    queryKey: ['learning', user?.email],
    queryFn: () => base44.entities.Learning.filter({ created_by: user.email }, '-created_date'),
    initialData: [],
    enabled: !!user?.email, // Changed from !!user to !!user?.email
  });

  const createLearning = useMutation({
    mutationFn: (data) => base44.entities.Learning.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      setShowCreateDialog(false);
      setNewLearning({ subject: "", goal: "", difficulty: "beginner", notes: "" });
    },
  });

  const updateLearning = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Learning.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
      setSelectedLearning(null);
    },
  });

  const deleteLearning = useMutation({
    mutationFn: (id) => base44.entities.Learning.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] });
    },
  });

  const handleCreateLearning = () => {
    if (!newLearning.subject.trim()) return;
    createLearning.mutate(newLearning);
  };

  const handleGenerateLesson = async (learning) => {
    setGeneratingLesson(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a ${learning.difficulty} level daily lesson for learning ${learning.subject}.
        
Learning Goal: ${learning.goal}
User's Notes: ${learning.notes}

Create a focused, practical lesson that:
1. Takes 10-15 minutes to complete
2. Builds on previous progress (they're on day ${learning.progress + 1})
3. Includes 3-5 actionable practice exercises
4. Is engaging and motivating

Format the lesson with clear sections and examples.`,
      });

      const today = new Date().toISOString().split('T')[0];
      const newStreak = learning.last_lesson_date === new Date(Date.now() - 86400000).toISOString().split('T')[0]
        ? learning.streak + 1
        : 1;

      await updateLearning.mutateAsync({
        id: learning.id,
        data: {
          daily_lesson: response,
          progress: learning.progress + 1,
          streak: newStreak,
          last_lesson_date: today,
        },
      });

      setSelectedLearning({ ...learning, daily_lesson: response });
    } catch (error) {
      console.error('Failed to generate lesson:', error);
      alert('Failed to generate lesson. Please try again.');
    } finally {
      setGeneratingLesson(false);
    }
  };

  const difficultyColors = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 dark:from-gray-950 dark:to-indigo-950/30 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Learning</h1>
              <p className="text-gray-500 dark:text-gray-400">Daily AI-powered lessons</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your learning paths...</p>
          </div>
        ) : learnings.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Start Your Learning Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Learn anything with AI-powered daily lessons. Each day, get a personalized 10-15 minute
              lesson tailored to your progress.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Learning Path
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learnings.map((learning) => (
              <Card
                key={learning.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedLearning(learning)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl">{learning.subject}</CardTitle>
                    <Badge className={difficultyColors[learning.difficulty]}>
                      {learning.difficulty}
                    </Badge>
                  </div>
                  {learning.goal && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{learning.goal}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium">Day {learning.progress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">{learning.streak} day streak</span>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateLesson(learning);
                      }}
                      disabled={generatingLesson}
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      {generatingLesson ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Today's Lesson
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Learning Path</DialogTitle>
              <DialogDescription>
                What would you like to learn? AI will generate daily lessons for you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Spanish, Python, Guitar..."
                  value={newLearning.subject}
                  onChange={(e) => setNewLearning({ ...newLearning, subject: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="goal">Learning Goal (optional)</Label>
                <Input
                  id="goal"
                  placeholder="e.g., Become conversational in Spanish"
                  value={newLearning.goal}
                  onChange={(e) => setNewLearning({ ...newLearning, goal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={newLearning.difficulty}
                  onValueChange={(value) => setNewLearning({ ...newLearning, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any specific focus areas or preferences..."
                  value={newLearning.notes}
                  onChange={(e) => setNewLearning({ ...newLearning, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLearning}
                  disabled={!newLearning.subject.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  Create Learning Path
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedLearning} onOpenChange={() => setSelectedLearning(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedLearning?.subject} - Day {selectedLearning?.progress}</span>
                <div className="flex items-center gap-2 text-sm font-normal">
                  <Flame className="w-4 h-4 text-orange-600" />
                  <span>{selectedLearning?.streak} day streak</span>
                </div>
              </DialogTitle>
            </DialogHeader>
            {selectedLearning?.daily_lesson ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{selectedLearning.daily_lesson}</div>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => deleteLearning.mutate(selectedLearning.id)}
                    className="text-red-600"
                  >
                    Delete Path
                  </Button>
                  <Button
                    onClick={() => {
                      updateLearning.mutate({
                        id: selectedLearning.id,
                        data: { status: 'completed' },
                      });
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Generate your first lesson to get started!
                </p>
                <Button
                  onClick={() => handleGenerateLesson(selectedLearning)}
                  disabled={generatingLesson}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  {generatingLesson ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating Lesson...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Generate First Lesson
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
