import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Clock, ListTodo, GitBranch, AlertTriangle } from 'lucide-react';

interface BlockCardProps {
  block: Block;
  onEdit: () => void;
  isDragging?: boolean;
}

export function BlockCard({ block, onEdit, isDragging }: BlockCardProps) {
  const { getBlockMetrics, getTasksByBlockId } = useJourneyStore();
  const metrics = getBlockMetrics(block.id);
  const tasks = getTasksByBlockId(block.id);

  const getSeverityColor = () => {
    if (metrics.delayedCount > 0) return 'border-l-danger';
    if (metrics.atRiskCount > 0) return 'border-l-warning';
    return 'border-l-success';
  };

  return (
    <div
      onClick={onEdit}
      className={cn(
        "block-card border-l-4",
        getSeverityColor(),
        isDragging && "opacity-50 rotate-2"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-foreground text-sm leading-tight">{block.name}</h4>
          {block.category && (
            <span className="text-xs text-muted-foreground">{block.category}</span>
          )}
        </div>
        {metrics.employeesInBlock > 0 && (
          <span className="px-2 py-0.5 text-xs font-medium bg-accent/10 text-accent rounded-full">
            {metrics.employeesInBlock}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ListTodo className="w-3.5 h-3.5" />
          <span>{tasks.length} tasks</span>
        </div>
        {block.rules.length > 0 && (
          <div className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{block.rules.length} rules</span>
          </div>
        )}
        {block.expectedDurationDays && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{block.expectedDurationDays}d SLA</span>
          </div>
        )}
      </div>

      {/* Dependencies */}
      {block.dependencyBlockIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Depends on: {block.dependencyBlockIds.length} block(s)
          </p>
        </div>
      )}

      {/* Risk indicator */}
      {(metrics.atRiskCount > 0 || metrics.delayedCount > 0) && (
        <div className="mt-3 flex items-center gap-2">
          {metrics.delayedCount > 0 && (
            <span className="badge-danger flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {metrics.delayedCount} delayed
            </span>
          )}
          {metrics.atRiskCount > 0 && (
            <span className="badge-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {metrics.atRiskCount} at risk
            </span>
          )}
        </div>
      )}
    </div>
  );
}
