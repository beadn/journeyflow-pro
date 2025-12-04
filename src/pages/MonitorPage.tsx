import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { MonitorByEmployee } from '@/components/monitor/MonitorByEmployee';
import { MonitorByJourney } from '@/components/monitor/MonitorByJourney';
import { MonitorByBlock } from '@/components/monitor/MonitorByBlock';
import { JourneyHealthOverview } from '@/components/monitor/JourneyHealthOverview';
import { cn } from '@/lib/utils';
import { Users, GitBranch, LayoutGrid, BarChart3, ArrowLeft } from 'lucide-react';

type MonitorView = 'overview' | 'employee' | 'journey' | 'block';

export default function MonitorPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<MonitorView>('overview');
  const { journeys, getJourneyById } = useJourneyStore();
  
  const journey = journeyId ? getJourneyById(journeyId) : null;

  // Redirect if journey not found
  useEffect(() => {
    if (journeyId && !journey) {
      navigate('/workflows');
    }
  }, [journeyId, journey, navigate]);

  const views = [
    { id: 'overview' as const, label: 'Health Overview', icon: BarChart3 },
    { id: 'employee' as const, label: 'By Employee', icon: Users },
    { id: 'journey' as const, label: 'By Journey', icon: GitBranch },
    { id: 'block' as const, label: 'By Block', icon: LayoutGrid },
  ];

  if (!journey) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workflows')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{journey.name}</h1>
            <p className="text-xs text-muted-foreground">Monitor</p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeView === view.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <view.icon className="w-4 h-4" />
              <span className="hidden md:inline">{view.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeView === 'overview' && (
          <JourneyHealthOverview journeyId={journeyId!} />
        )}
        {activeView === 'employee' && (
          <MonitorByEmployee journeyId={journeyId!} />
        )}
        {activeView === 'journey' && (
          <MonitorByJourney />
        )}
        {activeView === 'block' && (
          <MonitorByBlock journeyId={journeyId!} />
        )}
      </div>
    </div>
  );
}
