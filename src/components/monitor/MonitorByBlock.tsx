import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Users, Clock, AlertTriangle } from 'lucide-react';

interface MonitorByBlockProps {
  journeyId: string;
}

export function MonitorByBlock({ journeyId }: MonitorByBlockProps) {
  const { getBlocksByJourneyId, getBlockMetrics, getJourneyById } = useJourneyStore();
  const journey = getJourneyById(journeyId);
  const blocks = getBlocksByJourneyId(journeyId);

  if (!journey) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {blocks.map((block) => {
        const metrics = getBlockMetrics(block.id);
        const period = journey.periods.find((p) => p.id === block.periodId);
        const slaStatus = block.expectedDurationDays 
          ? metrics.averageTimeSpent > block.expectedDurationDays ? 'over' : 'ok'
          : 'none';

        return (
          <div key={block.id} className={cn(
            "factorial-card p-5 border-l-4",
            metrics.delayedCount > 0 ? 'border-l-danger' : metrics.atRiskCount > 0 ? 'border-l-warning' : 'border-l-success'
          )}>
            <div className="mb-4">
              <h4 className="font-semibold text-foreground">{block.name}</h4>
              <p className="text-xs text-muted-foreground">{period?.label}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> In block
                </span>
                <span className="text-sm font-medium">{metrics.employeesInBlock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Avg time
                </span>
                <span className={cn("text-sm font-medium", slaStatus === 'over' && 'text-danger')}>
                  {metrics.averageTimeSpent}d {block.expectedDurationDays && `/ ${block.expectedDurationDays}d`}
                </span>
              </div>
              {(metrics.atRiskCount > 0 || metrics.delayedCount > 0) && (
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  {metrics.delayedCount > 0 && (
                    <span className="badge-danger flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{metrics.delayedCount} delayed
                    </span>
                  )}
                  {metrics.atRiskCount > 0 && (
                    <span className="badge-warning flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />{metrics.atRiskCount} at risk
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
