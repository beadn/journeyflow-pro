import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block, BlockMetrics } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Clock, ListTodo, GitBranch, AlertTriangle } from 'lucide-react';

export const BlockNode = memo(({ data }: { data: { block: Block; onEdit: () => void; metrics: BlockMetrics } }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { block, onEdit, metrics } = data;
  const { getTasksByBlockId } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);

  const getSeverityColor = () => {
    if (metrics.delayedCount > 0) return 'border-danger bg-danger/5';
    if (metrics.atRiskCount > 0) return 'border-warning bg-warning/5';
    return 'border-success bg-success/5';
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card" />
      <div className={cn("min-w-[220px] max-w-[280px] rounded-xl border-2 bg-card shadow-factorial-md transition-all", getSeverityColor())}>
        <div className="p-4 cursor-pointer" onClick={onEdit}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm">{block.name}</h4>
              {block.category && <span className="text-xs text-muted-foreground">{block.category}</span>}
            </div>
            {metrics.employeesInBlock > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-accent text-accent-foreground rounded-full">{metrics.employeesInBlock}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><ListTodo className="w-3.5 h-3.5" />{tasks.length}</div>
            {block.rules.length > 0 && <div className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />{block.rules.length}</div>}
            {block.expectedDurationDays && <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{block.expectedDurationDays}d</div>}
          </div>
          {(metrics.atRiskCount > 0 || metrics.delayedCount > 0) && (
            <div className="flex items-center gap-2 mt-2">
              {metrics.delayedCount > 0 && <span className="badge-danger flex items-center gap-1 text-[10px]"><AlertTriangle className="w-2.5 h-2.5" />{metrics.delayedCount}</span>}
              {metrics.atRiskCount > 0 && <span className="badge-warning flex items-center gap-1 text-[10px]"><AlertTriangle className="w-2.5 h-2.5" />{metrics.atRiskCount}</span>}
            </div>
          )}
        </div>
        {tasks.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="w-full px-4 py-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2 animate-fade-in">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                <ListTodo className="w-3 h-3" /><span className="flex-1 truncate">{task.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card" />
    </>
  );
});

BlockNode.displayName = 'BlockNode';
