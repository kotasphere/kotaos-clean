import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  Plus,
  Search,
  TrendingUp,
  Receipt,
  BookOpen,
} from "lucide-react";

const NAVIGATION_ITEMS = [
  { title: "Assistant", url: "Assistant", icon: Brain, keywords: ["ai", "chat", "help"] },
  { title: "Calendar", url: "Calendar", icon: Calendar, keywords: ["events", "schedule"] },
  { title: "Tasks", url: "Tasks", icon: CheckSquare, keywords: ["todo", "todos"] },
  { title: "Bills", url: "Bills", icon: Receipt, keywords: ["payments", "expenses"] },
  { title: "Vault", url: "Vault", icon: Shield, keywords: ["assets", "inventory"] },
  { title: "Contacts", url: "Contacts", icon: Users, keywords: ["people", "friends"] },
  { title: "Learning", url: "Learning", icon: BookOpen, keywords: ["study", "education"] },
  { title: "Email", url: "EmailDrafts", icon: Mail, keywords: ["drafts", "compose"] },
  { title: "Projects", url: "Projects", icon: FolderKanban, keywords: ["work"] },
  { title: "Subscriptions", url: "Subscriptions", icon: CreditCard, keywords: ["recurring"] },
  { title: "Insights", url: "Insights", icon: TrendingUp, keywords: ["analytics", "stats", "trends"] },
  { title: "Settings", url: "Settings", icon: Settings, keywords: ["preferences", "profile"] },
];

const QUICK_ACTIONS = [
  { title: "Add Task", action: "add-task", icon: Plus, keywords: ["create", "new"] },
  { title: "Add Bill", action: "add-bill", icon: Plus, keywords: ["create", "new"] },
  { title: "Add Event", action: "add-event", icon: Plus, keywords: ["create", "new"] },
  { title: "Add Contact", action: "add-contact", icon: Plus, keywords: ["create", "new"] },
  { title: "Add Project", action: "add-project", icon: Plus, keywords: ["create", "new"] },
];

export default function CommandPalette({ onQuickAction }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((item) => {
    setOpen(false);
    
    if (item.url) {
      navigate(createPageUrl(item.url));
    } else if (item.action) {
      setTimeout(() => {
        onQuickAction?.(item.action);
      }, 100);
    }
  }, [navigate, onQuickAction]);

  return (
    <>
      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-600 cursor-pointer transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4" />
        <span>Quick search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-1.5 font-mono text-xs">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type to search or use quick actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            {NAVIGATION_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.url}
                  value={`${item.title} ${item.keywords.join(' ')}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            {QUICK_ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.action}
                  value={`${item.title} ${item.keywords.join(' ')}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}