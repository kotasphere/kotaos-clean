import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, User, Palette, Download, LogOut, Loader2, Upload } from "lucide-react";

export default function SettingsPage() {
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: () => base44.entities.Profile.list(),
    enabled: !!user,
  });

  const profile = profiles?.[0];

  const [formData, setFormData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    ai_name: profile?.ai_name || '',
    tone_preference: profile?.tone_preference || 'friendly',
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        ai_name: profile.ai_name || '',
        tone_preference: profile.tone_preference || 'friendly',
      });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data) => {
      if (profile) {
        return base44.entities.Profile.update(profile.id, data);
      }
      return base44.entities.Profile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      await updateProfile.mutateAsync({ ...formData, avatar_url: result.file_url });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(formData);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [conversations, tasks, events, assets, contacts, subscriptions, projects, memories] = await Promise.all([
        base44.entities.Conversation.list(),
        base44.entities.Task.list(),
        base44.entities.Event.list(),
        base44.entities.Asset.list(),
        base44.entities.Contact.list(),
        base44.entities.Subscription.list(),
        base44.entities.Project.list(),
        base44.entities.Memory.list(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: user,
        profile: profile,
        conversations,
        tasks,
        events,
        assets,
        contacts,
        subscriptions,
        projects,
        memories,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mylife-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50/30 dark:from-gray-950 dark:to-slate-950/30 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                    {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Change Avatar
                        </>
                      )}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="A little about yourself..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai_name">AI Assistant Name</Label>
                <Input
                  id="ai_name"
                  value={formData.ai_name}
                  onChange={(e) => setFormData({ ...formData, ai_name: e.target.value })}
                  placeholder="Nova, Atlas, Sage..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">AI Tone Preference</Label>
                <Select value={formData.tone_preference} onValueChange={(value) => setFormData({ ...formData, tone_preference: value })}>
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

              <Button onClick={handleSaveProfile} disabled={updateProfile.isLoading}>
                {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Account Plan
              </CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Current Plan: {profile?.plan || 'Free'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upgrade for more features (coming soon)
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription>Download all your data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export all your conversations, tasks, events, contacts, and more as a JSON file.
              </p>
              <Button onClick={handleExportData} disabled={exporting} variant="outline">
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Account Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}