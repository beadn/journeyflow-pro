import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export function MonitorByJourney() {
  const { journeys, getJourneyMetrics } = useJourneyStore();

  return (
    <div className="grid gap-6">
      {journeys.map((journey) => {
        const metrics = getJourneyMetrics(journey.id);
        return (
          <div key={journey.id} className="factorial-card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{journey.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{journey.type} • {journey.status}</p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                journey.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
              )}>
                {journey.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs">Total</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.totalEmployees}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/5">
                <div className="flex items-center gap-2 text-success mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">On Track</span>
                </div>
                <p className="text-2xl font-bold text-success">{metrics.onTrack}</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/5">
                <div className="flex items-center gap-2 text-warning mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs">At Risk</span>
                </div>
                <p className="text-2xl font-bold text-warning">{metrics.atRisk}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{metrics.averageDuration}d</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
