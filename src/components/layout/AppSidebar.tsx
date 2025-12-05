import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Home,
  GitBranch,
  HelpCircle
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/workflows', icon: GitBranch, label: 'Journeys' },
];

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-sm border border-border"
      >
        {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          isExpanded ? "w-64" : "w-0 lg:w-16",
          !isExpanded && "overflow-hidden lg:overflow-visible"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 flex-shrink-0">
              {/* Gradient background - Factorial red */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FF5252] to-[#E53935] shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-shadow" />
              {/* Inner glow */}
              <div className="absolute inset-[2px] rounded-[10px] bg-gradient-to-br from-white/20 to-transparent" />
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
            </div>
            {isExpanded && (
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-sm tracking-tight">JourneyFlow</span>
                <span className="text-[10px] text-muted-foreground -mt-0.5">Employee Lifecycle</span>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.to === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.to) || location.pathname.startsWith('/journey');
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive 
                    ? "bg-red-50 text-red-600 font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-red-500")} />
                {isExpanded && <span className="text-sm">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Help link */}
        <div className="p-3 border-t border-sidebar-border">
          <a
            href="https://github.com/beadn/journeyflow-pro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm">Documentation</span>}
          </a>
        </div>

        {/* Collapse button */}
        <div className="p-3 border-t border-sidebar-border hidden lg:block">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            {isExpanded ? (
              <ChevronRight className="w-5 h-5 rotate-180" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
