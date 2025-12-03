import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings as SettingsIcon, User, Palette, Download, LogOut, Loader2, Upload, Bell, Mic, CheckCircle, Trophy, Users } from "lucide-react";
import { checkAndAwardBadges, BADGE_DEFINITIONS } from "../components/badges/BadgeChecker";
import { format } from 'date-fns';
import BadgeEarnedDialog from "../components/badges/BadgeEarnedDialog";

export default function SettingsPage() {
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [checkingNotifications, setCheckingNotifications] = useState(false);
  const [newlyEarnedBadge, setNewlyEarnedBadge] = useState(null);
  const [checkingBadges, setCheckingBadges] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // CRITICAL: Use unique query key per user
  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      console.log('🔍 Settings: Fetching profile for:', user.email);
      const results = await base44.entities.Profile.filter({ created_by: user.email });
      console.log('📊 Settings: Profile results:', results);
      return results;
    },
    enabled: !!user?.email,
  });

  const profile = profiles?.[0];

  const { data: badges = [] } = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.Badge.filter({ user_id: user.id }, '-earned_date');
    },
    enabled: !!user?.id,
  });

  // Set signup_number for first user (creator)
  useEffect(() => {
    if (!profile?.id || !user || !base44?.entities?.Profile) return;
    if (profile.signup_number) return; // Already set
    
    // Get total user count to determine signup number
    base44.entities.Profile.list()
      .then(allProfiles => {
        const signupNumber = allProfiles.length;
        return base44.entities.Profile.update(profile.id, { signup_number: signupNumber });
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['profiles'] });
      })
      .catch(err => console.error('Failed to set signup number:', err));
  }, [profile?.id, user, queryClient]);

  // Check for new badges on page load
  useEffect(() => {
    if (!user?.id || !profile?.signup_number) return;
    
    checkAndAwardBadges(user.id).then(newBadges => {
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        setNewlyEarnedBadge(newBadges[0]);
      }
    }).catch(err => console.error('Failed to check badges:', err));
  }, [user?.id, profile?.signup_number, queryClient]);

  // Mark all badges as viewed when Settings page loads
  useEffect(() => {
    if (!badges.length || !base44?.entities?.Badge) return;
    
    const unviewedBadges = badges.filter(b => !b.viewed);
    if (unviewedBadges.length === 0) return;
    
    unviewedBadges.forEach(badge => {
      base44.entities.Badge.update(badge.id, { viewed: true })
        .catch(err => console.error('Failed to mark badge as viewed:', err));
    });
  }, [badges]);

  const [formData, setFormData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    ai_name: profile?.ai_name || '',
    tone_preference: profile?.tone_preference || 'friendly',
    notifications: profile?.notifications || {
      bills_enabled: true,
      tasks_enabled: true,
      events_enabled: true,
      subscriptions_enabled: true,
      email_notifications: true
    },
    voice_settings: profile?.voice_settings || {
      enabled: false,
      voice_id: 'rachel',
      auto_play: false
    },
    daily_digest: profile?.daily_digest || {
      enabled: false,
      time: '07:00',
      timezone: 'America/Chicago'
    }
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        bio: profile.bio || '',
        ai_name: profile.ai_name || '',
        tone_preference: profile.tone_preference || 'friendly',
        notifications: profile.notifications || {
          bills_enabled: true,
          tasks_enabled: true,
          events_enabled: true,
          subscriptions_enabled: true,
          email_notifications: true
        },
        voice_settings: profile.voice_settings || {
          enabled: false,
          voice_id: 'rachel',
          auto_play: false
        },
        daily_digest: profile.daily_digest || {
          enabled: false,
          time: '07:00',
          timezone: 'America/Chicago'
        }
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
      queryClient.invalidateQueries({ queryKey: ['userProfile'] }); // Invalidate the specific userProfile query
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
      alert('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = () => {
    updateProfile.mutate(formData);
  };

  const handleSendTestEmail = async () => {
    if (!user?.email) {
      alert('No email address found');
      return;
    }

    setSendingTest(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: 'KOTA OS - Test Notification',
        body: `Hello ${formData.username || 'there'}!

This is a test notification from your KOTA OS app.

Your notification settings are currently:
✅ Bills: ${formData.notifications.bills_enabled ? 'Enabled' : 'Disabled'}
✅ Tasks: ${formData.notifications.tasks_enabled ? 'Enabled' : 'Disabled'}
✅ Events: ${formData.notifications.events_enabled ? 'Enabled' : 'Disabled'}
✅ Subscriptions: ${formData.notifications.subscriptions_enabled ? 'Enabled' : 'Disabled'}

You'll receive emails when:
- Bills are due within 3 days
- Tasks are due soon
- Events are coming up
- Subscriptions are about to renew

Best regards,
Your KOTA OS`
      });

      alert('✅ Test email sent! Check your inbox.');
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send test email. Please try again.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [conversations, tasks, events, assets, contacts, subscriptions, projects, memories, bills] = await Promise.all([
        base44.entities.Conversation.list(),
        base44.entities.Task.list(),
        base44.entities.Event.list(),
        base44.entities.Asset.list(),
        base44.entities.Contact.list(),
        base44.entities.Subscription.list(),
        base44.entities.Project.list(),
        base44.entities.Memory.list(),
        base44.entities.Bill.list(),
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
        bills,
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
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleManualBadgeCheck = async () => {
    if (!user) return;
    
    setCheckingBadges(true);
    try {
      const newBadges = await checkAndAwardBadges(user.id);
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        queryClient.invalidateQueries({ queryKey: ['unviewedBadges'] }); // Invalidate the unviewed badges count
        setNewlyEarnedBadge(newBadges[0]);
        alert(`🎉 You earned ${newBadges.length} new badge${newBadges.length > 1 ? 's' : ''}!`);
      } else {
        alert('✅ All badges up to date! Keep using KOTA OS to earn more.');
      }
    } catch (error) {
      console.error('Badge check error:', error);
      alert('Failed to check badges. Please try again.');
    } finally {
      setCheckingBadges(false);
    }
  };

  const handleCheckNotifications = async () => {
    setCheckingNotifications(true);
    try {
      const response = await base44.functions.invoke('createSystemNotifications', {});
      
      // Refresh notifications in the UI
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      if (response.data.notificationsCreated > 0) {
        alert(`✅ Created ${response.data.notificationsCreated} new notification${response.data.notificationsCreated > 1 ? 's' : ''}!\n\nCheck the notification bell in the sidebar.`);
      } else {
        alert('✅ All notifications are up to date! You have no new events, tasks, or bills due soon.');
      }
    } catch (error) {
      console.error('Notification check error:', error);
      alert(`❌ Failed to check notifications.\n\nMake sure the "createSystemNotifications" backend function is deployed.\n\nError: ${error.message || 'Unknown error'}`);
    } finally {
      setCheckingNotifications(false);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-50/30 dark:from-gray-950 dark:to-slate-950/30 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
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
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                    <SelectItem value="sarcastic">Sarcastic 😏</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formData.tone_preference === 'sarcastic' && '😏 Your AI will be witty and playfully sarcastic (but still helpful!)'}
                  {formData.tone_preference === 'friendly' && '😊 Warm and conversational'}
                  {formData.tone_preference === 'professional' && '💼 Polished and business-like'}
                  {formData.tone_preference === 'concise' && '⚡ Brief and to-the-point'}
                </p>
              </div>

              <Button onClick={handleSaveProfile} disabled={updateProfile.isLoading}>
                {updateProfile.isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Badges Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Achievements & Badges
              </CardTitle>
              <CardDescription>
                {badges.length} {badges.length === 1 ? 'badge' : 'badges'} earned
                {profile?.signup_number && profile.signup_number <= 25 && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-semibold">
                    👑 Legend #{profile.signup_number}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {badges.length === 0 ? 'Start using KOTA OS to earn badges!' : 'Keep going to unlock more badges!'}
                </p>
                <Button
                  onClick={handleManualBadgeCheck}
                  disabled={checkingBadges}
                  size="sm"
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-950/20"
                >
                  {checkingBadges ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Check Badges
                    </>
                  )}
                </Button>
              </div>

              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No badges yet. Click "Check Badges" to see what you've earned!
                  </p>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                    <div>👑 Legend (First 25 users)</div>
                    <div>✅ Task Master (50+ tasks)</div>
                    <div>📁 Project Pro (10+ projects)</div>
                    <div>👥 Social Butterfly (20+ contacts)</div>
                    <div>🔐 Vault Keeper (25+ assets)</div>
                    <div>⚡ Power User (100+ items)</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {badges.map(badge => (
                    <div
                      key={badge.id}
                      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 hover:shadow-lg transition-shadow"
                    >
                      <div className="text-4xl mb-2">{badge.badge_icon}</div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {badge.badge_name}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {badge.badge_description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Earned {format(new Date(badge.earned_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress towards next badges */}
              {badges.length > 0 && badges.length < Object.keys(BADGE_DEFINITIONS).length && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Keep Going! More Badges Available
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
                    {Object.entries(BADGE_DEFINITIONS)
                      .filter(([type]) => !badges.find(b => b.badge_type === type))
                      .slice(0, 6)
                      .map(([type, def]) => (
                        <div key={type} className="flex items-center gap-1">
                          <span className="text-lg">{def.icon}</span>
                          <span>{def.name}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Referral Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Refer Friends
              </CardTitle>
              <CardDescription>Earn badges by inviting friends to KOTA OS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-3xl">🎁</div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Your Referral Code
                  </p>
                  <code className="text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded mt-1 inline-block">
                    {profile?.referral_code || 'Generating...'}
                  </code>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {profile?.referral_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Referrals</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {5 - (profile?.referral_count || 0) > 0 ? 5 - (profile?.referral_count || 0) : 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Until 🎁 Badge
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Digest Email Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Daily Look-Ahead Email
              </CardTitle>
              <CardDescription>
                Get a personalized daily briefing every morning with your schedule, tasks, bills, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="daily_digest_enabled">Enable Daily Digest</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive a beautiful morning email with your day's overview
                  </p>
                </div>
                <Switch
                  id="daily_digest_enabled"
                  checked={formData.daily_digest.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      daily_digest: { ...formData.daily_digest, enabled: checked }
                    })
                  }
                />
              </div>

              {formData.daily_digest.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="space-y-2">
                    <Label htmlFor="digest_time">Delivery Time (CST/CDT)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="digest_time"
                        type="time"
                        value={formData.daily_digest.time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            daily_digest: { ...formData.daily_digest, time: e.target.value }
                          })
                        }
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Central Time
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your daily briefing will arrive at {formData.daily_digest.time} every morning
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      📧 Your Daily Digest Includes:
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>✅ Tasks due today and upcoming</li>
                      <li>📅 Events and appointments scheduled</li>
                      <li>💰 Bills due soon</li>
                      <li>📊 Active projects overview</li>
                      <li>🔔 Important reminders</li>
                      <li>☀️ Personalized greeting based on your schedule</li>
                    </ul>
                  </div>
                </div>
              )}

              <Button onClick={handleSaveProfile} disabled={updateProfile.isLoading}>
                {updateProfile.isLoading ? 'Saving...' : 'Save Daily Digest Settings'}
              </Button>
            </CardContent>
          </Card>

          {/* Voice Assistant Card - Updated */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Voice Assistant
              </CardTitle>
              <CardDescription>AI voice responses (Coming in Future Update)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🎤 Voice features with ElevenLabs integration will be available in a future update. Stay tuned!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    ✅ Smart Notifications Active
                  </p>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  Notifications are automatically created for upcoming tasks, events, bills, and subscriptions.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="bills_enabled">Bill Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified about upcoming and overdue bills
                    </p>
                  </div>
                  <Switch
                    id="bills_enabled"
                    checked={formData.notifications.bills_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, bills_enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="tasks_enabled">Task Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified about tasks due soon
                    </p>
                  </div>
                  <Switch
                    id="tasks_enabled"
                    checked={formData.notifications.tasks_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, tasks_enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="events_enabled">Event Reminders</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified about upcoming events
                    </p>
                  </div>
                  <Switch
                    id="events_enabled"
                    checked={formData.notifications.events_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, events_enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="subscriptions_enabled">Subscription Renewals</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified about upcoming subscription renewals
                    </p>
                  </div>
                  <Switch
                    id="subscriptions_enabled"
                    checked={formData.notifications.subscriptions_enabled}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, subscriptions_enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Master toggle for all email notifications
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={formData.notifications.email_notifications}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        notifications: { ...formData.notifications, email_notifications: checked }
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button onClick={handleSaveProfile} disabled={updateProfile.isLoading} className="flex-1">
                  {updateProfile.isLoading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
                <Button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !formData.notifications.email_notifications}
                  variant="outline"
                  className="flex-1"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Test Email'
                  )}
                </Button>
              </div>
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
                Export all your conversations, tasks, events, contacts, bills, and more as a JSON file. Your data persists between sessions and is always accessible.
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

      {/* Badge Earned Celebration Dialog */}
      <BadgeEarnedDialog
        badge={newlyEarnedBadge}
        open={!!newlyEarnedBadge}
        onClose={() => setNewlyEarnedBadge(null)}
      />
    </div>
  );
}