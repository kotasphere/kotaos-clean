
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Calendar,
  CheckSquare,
  Shield,
  Users,
  CreditCard,
  FolderKanban,
  Mail,
  Settings,
  Menu,
  Sun,
  Moon,
  Sparkles,
  Receipt,
  MessageSquare,
  Bell,
  BookOpen,
  Loader2,
  TrendingUp, // Added TrendingUp icon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DraggableFloatingButton from "@/components/shared/DraggableFloatingButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import ProfileDialog from "@/components/profile/ProfileDialog";
import UserAvatar from "@/components/profile/UserAvatar";
import CommandPalette from "@/components/shared/CommandPalette"; // Added CommandPalette import
import QuickCapture from "@/components/shared/QuickCapture"; // Added QuickCapture import

const navigationItems = [
  { title: "Assistant", url: createPageUrl("Assistant"), icon: Brain },
  { title: "Daily", url: createPageUrl("Daily"), icon: CheckSquare },
  { title: "Insights", url: createPageUrl("Insights"), icon: TrendingUp },
  { title: "Calendar", url: createPageUrl("Calendar"), icon: Calendar },
  { title: "Tasks", url: createPageUrl("Tasks"), icon: CheckSquare },
  { title: "Bills", url: createPageUrl("Bills"), icon: Receipt },
  { title: "Vault", url: createPageUrl("Vault"), icon: Shield },
  { title: "Learning", url: createPageUrl("Learning"), icon: BookOpen },
  { title: "Email", url: createPageUrl("EmailDrafts"), icon: Mail },
  { title: "Projects", url: createPageUrl("Projects"), icon: FolderKanban },
  { title: "Subscriptions", url: createPageUrl("Subscriptions"), icon: CreditCard },
];

function NotificationBell() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id || !base44?.entities?.Notification) return [];
      try {
        return await base44.entities.Notification.filter({ user_id: user.id, read: false });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const queryClient = useQueryClient();
  const [processingNotificationId, setProcessingNotificationId] = useState(null);
  
  const handleClick = async (notification) => {
    if (!notification?.id || !base44?.entities?.Notification) return;
    
    setProcessingNotificationId(notification.id);
    
    try {
      // Handle connection request acceptance
      if (notification.action_type === 'accept_connection' && notification.action_data) {
        const { contact_id, from_user_id, from_user_email, from_user_name } = notification.action_data;
        const displayName = from_user_name || 'this user';
        
        if (window.confirm(`Accept connection request from ${displayName}?`)) {
          // Call backend function to accept connection
          const response = await base44.functions.invoke('acceptConnectionRequest', {
            contact_id,
            from_user_id,
            from_user_email
          });
          
          if (response.data.success) {
            // Mark notification as read and completed
            await base44.entities.Notification.update(notification.id, { 
              read: true, 
              completed: true 
            });
            
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            
            alert('✅ Connection request accepted! You can now message each other from the Contacts page.');
          } else {
            throw new Error(response.data.error || 'Failed to accept connection');
          }
        } else {
          // User declined - just mark as read
          await base44.entities.Notification.update(notification.id, { read: true });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      } else {
        // For other notification types, just mark as read and navigate
        await base44.entities.Notification.update(notification.id, { read: true });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        
        if (notification.action_url) {
          window.location.href = notification.action_url;
        }
      }
    } catch (error) {
      console.error('Failed to handle notification:', error);
      alert(`❌ Failed to process notification: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingNotificationId(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <h3 className="font-semibold mb-2">Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No new notifications</p>
          ) : (
            <ScrollArea className="max-h-96">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer mb-2 border border-gray-200 dark:border-gray-700 ${
                    processingNotificationId === notif.id ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                      {notif.action_required && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {notif.action_type === 'accept_connection' ? 'Click to Accept' : 'Action Required'}
                        </Badge>
                      )}
                      {processingNotificationId === notif.id && (
                        <p className="text-xs text-blue-600 mt-1">Processing...</p>
                      )}
                    </div>
                    {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FloatingNavButton() {
  return (
    <SidebarTrigger className="lg:hidden w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-0"
      style={{ 
        pointerEvents: 'auto',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform'
      }}
    >
      <Menu className="w-6 h-6" />
    </SidebarTrigger>
  );
}

function NavigationItemWithBadge({ item, location, notificationCount }) {
  const { setOpen, setOpenMobile } = useSidebar();
  const isActive = location.pathname === item.url;
  
  const handleNavClick = () => {
    // Close sidebar on mobile screens
    if (window.innerWidth < 1024) {
      setOpen(false);
      if (setOpenMobile) {
        setOpenMobile(false);
      }
    }
  };
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link 
          to={item.url} 
          onClick={handleNavClick}
        >
          <item.icon className="w-4 h-4" />
          <span className="font-medium">{item.title}</span>
          {notificationCount > 0 && (
            <Badge className="ml-auto bg-red-600 text-white h-5 min-w-5 flex items-center justify-center px-1">
              {notificationCount}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [theme, setTheme] = useState("system");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // CRITICAL: Filter by BOTH created_by AND ensure only ONE profile per user
  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.email || !base44?.entities?.Profile) return [];
      try {
        console.log('🔍 Fetching profile for user:', user.email);
        const results = await base44.entities.Profile.filter({ created_by: user.email });
        console.log('📊 Profile results:', results);
        return results;
      } catch (error) {
        console.error('❌ Failed to fetch profiles:', error);
        return [];
      }
    },
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id || !base44?.entities?.Notification) return [];
      try {
        return await base44.entities.Notification.filter({ user_id: user.id, read: false });
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const { data: unviewedBadges = [] } = useQuery({
    queryKey: ['unviewedBadges', user?.id],
    queryFn: async () => {
      if (!user?.id || !base44?.entities?.Badge) return [];
      try {
        return await base44.entities.Badge.filter({ user_id: user.id, viewed: false });
      } catch (error) {
        console.error('Failed to fetch badges:', error);
        return [];
      }
    },
    enabled: !!user?.id,
    refetchInterval: 5000,
  });

  const profile = profiles?.[0];
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: (data) => {
      if (profile?.id) {
        return base44.entities.Profile.update(profile.id, data);
      }
      return base44.entities.Profile.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id, user?.email] });
    },
  });

  // Create profile ONCE for new users with proper signup number
  useEffect(() => {
    if (!user || !user.email || !base44?.entities?.Profile) return;
    if (profiles === undefined) return; // Still loading
    if (profiles.length > 0) return; // Profile exists
    
    console.log('🆕 Creating new profile for:', user.email);
    
    const username = user.full_name || user.email?.split('@')[0] || 'User';
    
    // Get count of ALL profiles to determine signup number
    base44.entities.Profile.list()
      .then(allProfiles => {
        const signupNumber = allProfiles.length + 1;
        console.log('📝 Assigning signup number:', signupNumber);
        
        return updateProfile.mutateAsync({
          username: username,
          plan: 'free',
          signup_number: signupNumber,
        });
      })
      .catch(err => {
        console.error('❌ Failed to create profile:', err);
      });
  }, [user?.email, profiles]);

  useEffect(() => {
    const applyTheme = (newTheme) => {
      const root = window.document.documentElement;
      if (newTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', prefersDark);
      } else {
        root.classList.toggle('dark', newTheme === 'dark');
      }
    };

    if (profile) {
      const savedTheme = localStorage.getItem('mylife-theme') || profile?.theme || 'system';
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, [profile]);

  const toggleTheme = useCallback(async () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(newTheme);
    localStorage.setItem('mylife-theme', newTheme);

    const root = window.document.documentElement;
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', newTheme === 'dark');
    }

    if (profile && base44?.entities?.Profile) {
      try {
        await base44.entities.Profile.update(profile.id, { theme: newTheme });
      } catch (error) {
        console.error('Failed to update theme:', error);
      }
    }
  }, [theme, profile, base44?.entities?.Profile]);

  const getThemeIcon = useCallback(() => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  }, [theme]);

  const handleLogout = useCallback(() => {
    base44.auth.logout();
  }, []);

  const getNotificationCount = useCallback((pageTitle) => {
    const notificationTypeMap = {
      'Calendar': ['event_reminder'],
      'Tasks': ['task_invite', 'task_due'],
      'Bills': ['bill_due'],
      'Projects': ['project_invite'],
      'Subscriptions': ['subscription_renewal']
    };

    const types = notificationTypeMap[pageTitle];
    if (!types) return 0;

    return notifications.filter(n => types.includes(n.type)).length;
  }, [notifications]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/20">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/30 dark:to-purple-950/20">
        <Sidebar className="border-r border-gray-200 dark:border-gray-800">
          <SidebarHeader className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ff92f4fc2f1b7aa86a06b2/31673f46d_file_00000000a22461f798f22c646057aa3b1.png" 
                  alt="KOTA OS"
                  className="w-10 h-10 object-contain dark:hidden"
                />
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ff92f4fc2f1b7aa86a06b2/4ecec0417_file_00000000f3f061f7ad85b20d3e55a74e.png" 
                  alt="KOTA OS"
                  className="w-10 h-10 object-contain hidden dark:block"
                />
                <div>
                  <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                    KOTA OS
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Your Life, Organized</p>
                </div>
              </div>
              <div className="flex items-center gap-1"> {/* Added CommandPalette and NotificationBell wrapper */}
                <CommandPalette />
                <NotificationBell />
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <NavigationItemWithBadge
                      key={item.title}
                      item={item}
                      location={location}
                      notificationCount={getNotificationCount(item.title)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-2">
                System
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <NavigationItemWithBadge
                    item={{
                      title: "Settings",
                      url: createPageUrl("Settings"),
                      icon: Settings
                    }}
                    location={location}
                    notificationCount={unviewedBadges.length}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                onClick={() => setShowProfileDialog(true)}
                className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <UserAvatar size="sm" showCrown={true} />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {profile?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profile?.plan || 'free'} plan
                  </p>
                </div>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="flex-shrink-0"
              >
                {getThemeIcon()}
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
              <Link to={createPageUrl("Support")} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Support
              </Link>
              <span>•</span>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                Privacy
              </Link>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        <DraggableFloatingButton 
          storageKey="floating-nav-position"
          defaultPosition={{ bottom: 24, left: 24 }}
          zIndex={40}
        >
          <FloatingNavButton />
        </DraggableFloatingButton>
        
        <DraggableFloatingButton 
          storageKey="quick-capture-position"
          defaultPosition={{ bottom: 24, right: 24 }}
          zIndex={40}
        >
          <QuickCapture />
        </DraggableFloatingButton>

        <ProfileDialog
          open={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          userId={user?.id}
        />
      </div>
    </SidebarProvider>
  );
}
