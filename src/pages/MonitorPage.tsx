import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { MonitorByEmployee } from '@/components/monitor/MonitorByEmployee';
import { MonitorByJourney } from '@/components/monitor/MonitorByJourney';
import { MonitorByBlock } from '@/components/monitor/MonitorByBlock';
import { JourneyHealthOverview } from '@/components/monitor/JourneyHealthOverview';
import { cn } from '@/lib/utils';
import { Users, GitBranch, LayoutGrid, BarChart3 } from 'lucide-react';

type MonitorView = 'overview' | 'employee' | 'journey' | 'block';

export default function MonitorPage() {
  const { view: urlView } = useParams();
  const [activeView, setActiveView] = useState<MonitorView>(
    (urlView as MonitorView) || 'overview'
  );
  const { journeys } = useJourneyStore();
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(
    journeys[0]?.id || null
  );

  const views = [
    { id: 'overview' as const, label: 'Health Overview', icon: BarChart3 },
    { id: 'employee' as const, label: 'By Employee', icon: Users },
    { id: 'journey' as const, label: 'By Journey', icon: GitBranch },
    { id: 'block' as const, label: 'By Block', icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">Journey Monitor</h1>
          
          {/* Journey filter */}
          <select
            value={selectedJourneyId || ''}
            onChange={(e) => setSelectedJourneyId(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Journeys</option>
            {journeys.map((j) => (
              <option key={j.id} value={j.id}>{j.name}</option>
            ))}
          </select>
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
        {activeView === 'overview' && selectedJourneyId && (
          <JourneyHealthOverview journeyId={selectedJourneyId} />
        )}
        {activeView === 'overview' && !selectedJourneyId && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Select a journey to view health overview</p>
          </div>
        )}
        {activeView === 'employee' && (
          <MonitorByEmployee journeyId={selectedJourneyId} />
        )}
        {activeView === 'journey' && (
          <MonitorByJourney />
        )}
        {activeView === 'block' && selectedJourneyId && (
          <MonitorByBlock journeyId={selectedJourneyId} />
        )}
        {activeView === 'block' && !selectedJourneyId && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Select a journey to view block metrics</p>
          </div>
        )}
      </div>
    </div>
  );
}
