import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Users, 
  GitBranch, 
  Activity, 
  ChevronDown, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Builder', path: '/builder', icon: <GitBranch className="w-5 h-5" /> },
  { label: 'Monitor', path: '/monitor', icon: <Activity className="w-5 h-5" /> },
];

export function AppSidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLifecycleOpen, setIsLifecycleOpen] = useState(true);
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-factorial border border-border"
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
          {/* Main section */}
          <div>
            <button
              onClick={() => setIsLifecycleOpen(!isLifecycleOpen)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
                isExpanded ? "justify-between" : "justify-center"
              )}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                {isExpanded && <span className="text-sm font-medium">EmployeeLifeCycle</span>}
              </div>
              {isExpanded && (
                isLifecycleOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isLifecycleOpen && isExpanded && (
              <div className="mt-1 ml-4 space-y-1 animate-fade-in">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      isActive(item.path)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}

            {!isExpanded && (
              <div className="mt-2 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center justify-center p-2.5 rounded-lg transition-colors",
                      isActive(item.path)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                    title={item.label}
                  >
                    {item.icon}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
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
