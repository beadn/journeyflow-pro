import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Users, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const isActive = location.pathname.startsWith('/workflows') || 
                   location.pathname.startsWith('/builder') || 
                   location.pathname.startsWith('/monitor');

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
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            {isExpanded && (
              <span className="font-semibold text-foreground text-sm">Employee Lifecycle</span>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/workflows"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              isExpanded ? "justify-start" : "justify-center",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
            title="Employee Lifecycle"
          >
            <Users className="w-5 h-5" />
            {isExpanded && <span className="text-sm font-medium">Employee Lifecycle</span>}
          </NavLink>
        </nav>

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
