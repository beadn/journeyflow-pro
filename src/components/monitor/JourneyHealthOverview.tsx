import { useJourneyStore } from '@/stores/journeyStore';
import { Users, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface JourneyHealthOverviewProps {
  journeyId: string;
}

export function JourneyHealthOverview({ journeyId }: JourneyHealthOverviewProps) {
  const { getJourneyMetrics, getBlocksByJourneyId, getBlockMetrics, getJourneyById } = useJourneyStore();
  const journey = getJourneyById(journeyId);
  const metrics = getJourneyMetrics(journeyId);
  const blocks = getBlocksByJourneyId(journeyId);

  if (!journey) return null;

  const stats = [
    { label: 'Total Employees', value: metrics.totalEmployees, icon: Users, color: 'text-foreground' },
    { label: 'On Track', value: metrics.onTrack, icon: TrendingUp, color: 'text-success' },
    { label: 'At Risk', value: metrics.atRisk, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Delayed', value: metrics.delayed, icon: AlertTriangle, color: 'text-danger' },
    { label: 'Completed', value: metrics.completed, icon: CheckCircle, color: 'text-accent' },
    { label: 'Avg Duration', value: `${metrics.averageDuration}d`, icon: Clock, color: 'text-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-1">{journey.name}</h2>
        <p className="text-sm text-muted-foreground">Journey Health Overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="factorial-card p-4">
            <div className={`flex items-center gap-2 mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
              <span className="text-xs">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="factorial-card p-6">
        <h3 className="font-semibold text-foreground mb-4">Block-level Bottlenecks</h3>
        <div className="space-y-3">
          {blocks.map((block) => {
            const blockMetrics = getBlockMetrics(block.id);
            const sla = block.expectedDurationDays || 0;
            const deviation = sla ? ((blockMetrics.averageTimeSpent - sla) / sla) * 100 : 0;
            
            return (
              <div key={block.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{block.name}</p>
                  <p className="text-xs text-muted-foreground">{blockMetrics.employeesInBlock} employees</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{blockMetrics.averageTimeSpent}d avg</p>
                  {sla > 0 && (
                    <p className={`text-xs ${deviation > 0 ? 'text-danger' : 'text-success'}`}>
                      {deviation > 0 ? '+' : ''}{Math.round(deviation)}% vs SLA
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  {blockMetrics.delayedCount > 0 && <span className="badge-danger text-[10px]">{blockMetrics.delayedCount}</span>}
                  {blockMetrics.atRiskCount > 0 && <span className="badge-warning text-[10px]">{blockMetrics.atRiskCount}</span>}
                  {blockMetrics.delayedCount === 0 && blockMetrics.atRiskCount === 0 && <span className="badge-success text-[10px]">OK</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
