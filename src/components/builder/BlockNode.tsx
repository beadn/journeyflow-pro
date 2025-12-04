import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block, BlockMetrics } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  ListTodo, 
  GitBranch, 
  AlertTriangle,
  Link2,
  Filter,
  Zap,
  UserCheck,
  Bell,
  CheckSquare
} from 'lucide-react';

export const BlockNode = memo(({ data }: { data: { block: Block; onEdit: () => void; metrics: BlockMetrics } }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { block, onEdit, metrics } = data;
  const { getTasksByBlockId, blocks } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);

  // Get dependency block names
  const dependencyNames = block.dependencyBlockIds
    .map(depId => blocks.find(b => b.id === depId)?.name)
    .filter(Boolean);

  const getSeverityColor = () => {
    if (metrics.delayedCount > 0) return 'border-danger bg-danger/5';
    if (metrics.atRiskCount > 0) return 'border-warning bg-warning/5';
    return 'border-border bg-card';
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'add_task': return <ListTodo className="w-3 h-3" />;
      case 'remove_task': return <ListTodo className="w-3 h-3" />;
      case 'override_assignee': return <UserCheck className="w-3 h-3" />;
      case 'skip_block': return <Zap className="w-3 h-3" />;
      case 'require_approval': return <CheckSquare className="w-3 h-3" />;
      default: return <Filter className="w-3 h-3" />;
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} className="!w-4 !h-4 !bg-accent !border-2 !border-card !-left-2" />
      
      <div className={cn(
        "min-w-[260px] max-w-[320px] rounded-xl border-2 shadow-factorial-lg transition-all hover:shadow-factorial-xl",
        getSeverityColor()
      )}>
        {/* Header */}
        <div className="p-4 cursor-pointer" onClick={onEdit}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground text-sm leading-tight">{block.name}</h4>
              {block.category && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-full">
                  {block.category}
                </span>
              )}
            </div>
            {metrics.employeesInBlock > 0 && (
              <span className="px-2.5 py-1 text-xs font-bold bg-accent text-accent-foreground rounded-full animate-pulse">
                {metrics.employeesInBlock}
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
              <ListTodo className="w-3.5 h-3.5" />
              <span className="font-medium">{tasks.length} tasks</span>
            </div>
            {block.expectedDurationDays && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{block.expectedDurationDays}d SLA</span>
              </div>
            )}
          </div>

          {/* Risk indicators */}
          {(metrics.atRiskCount > 0 || metrics.delayedCount > 0) && (
            <div className="flex items-center gap-2 mb-3">
              {metrics.delayedCount > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold bg-danger/10 text-danger rounded-md border border-danger/20">
                  <AlertTriangle className="w-3 h-3" />
                  {metrics.delayedCount} delayed
                </span>
              )}
              {metrics.atRiskCount > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold bg-warning/10 text-warning rounded-md border border-warning/20">
                  <AlertTriangle className="w-3 h-3" />
                  {metrics.atRiskCount} at risk
                </span>
              )}
            </div>
          )}

          {/* Dependencies section */}
          {dependencyNames.length > 0 && (
            <div className="p-2.5 rounded-lg bg-accent/30 border border-accent/50 mb-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-accent-foreground uppercase tracking-wide mb-2">
                <Link2 className="w-3 h-3" />
                Depends on
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dependencyNames.map((name, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-[11px] font-medium bg-card text-foreground rounded-md border border-border shadow-sm">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rules/Conditions section */}
          {block.rules.length > 0 && (
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wide mb-2">
                <GitBranch className="w-3 h-3" />
                {block.rules.length} Audience {block.rules.length === 1 ? 'Rule' : 'Rules'}
              </div>
              <div className="space-y-1.5">
                {block.rules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="flex items-start gap-2 p-2 rounded-md bg-card/80 border border-border/50 text-[11px]">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      {getActionIcon(rule.action.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{rule.label}</div>
                      <div className="text-muted-foreground mt-0.5">
                        <span className="text-primary font-medium">IF</span>{' '}
                        <span className="bg-muted px-1 rounded">{rule.condition.attribute}</span>{' '}
                        <span className="text-muted-foreground">{rule.condition.operator.replace('_', ' ')}</span>{' '}
                        <span className="bg-muted px-1 rounded">{Array.isArray(rule.condition.value) ? rule.condition.value.join(', ') : rule.condition.value}</span>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="text-success font-medium">THEN</span>{' '}
                        <span className="text-foreground">{rule.action.type.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {block.rules.length > 3 && (
                  <div className="text-[10px] text-muted-foreground text-center py-1">
                    +{block.rules.length - 3} more rules...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Expandable tasks section */}
        {tasks.length > 0 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
              className="w-full px-4 py-2.5 border-t border-border flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isExpanded ? 'Hide Tasks' : `Show ${tasks.length} Tasks`}
            </button>
            
            {isExpanded && (
              <div className="px-4 pb-4 space-y-2 animate-fade-in border-t border-border pt-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
                    <div className={cn(
                      "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                      task.type === 'basic' && "bg-muted text-muted-foreground",
                      task.type === 'data_input' && "bg-accent/20 text-accent-foreground",
                      task.type === 'signature' && "bg-primary/20 text-primary",
                      task.type === 'review' && "bg-warning/20 text-warning",
                      task.type === 'notification' && "bg-info/20 text-info",
                    )}>
                      {task.type === 'notification' ? <Bell className="w-3 h-3" /> : <ListTodo className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{task.title}</div>
                      {task.assigneeLabel && (
                        <div className="text-muted-foreground text-[10px] mt-0.5">
                          Assigned to: {task.assigneeLabel}
                        </div>
                      )}
                      {task.simpleCondition && (
                        <div className="mt-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] inline-flex items-center gap-1">
                          <Filter className="w-2.5 h-2.5" />
                          Conditional
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-4 !h-4 !bg-accent !border-2 !border-card !-right-2" />
    </>
  );
});

BlockNode.displayName = 'BlockNode';
