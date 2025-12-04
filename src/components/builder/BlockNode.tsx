import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Plus, Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, Layers } from 'lucide-react';

interface BlockNodeProps {
  data: { 
    block: Block; 
    onEdit: () => void; 
    stepNumber?: number;
  };
}

const getCategoryConfig = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'legal':
      return { 
        badge: 'bg-[hsl(var(--category-legal)/0.15)] text-[hsl(var(--category-legal))]',
        border: 'border-[hsl(var(--category-legal)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-legal)/0.05)]',
        icon: Scale 
      };
    case 'it':
      return { 
        badge: 'bg-[hsl(var(--category-it)/0.15)] text-[hsl(var(--category-it))]',
        border: 'border-[hsl(var(--category-it)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-it)/0.05)]',
        icon: Monitor 
      };
    case 'hr':
      return { 
        badge: 'bg-[hsl(var(--category-hr)/0.15)] text-[hsl(var(--category-hr))]',
        border: 'border-[hsl(var(--category-hr)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-hr)/0.05)]',
        icon: Users 
      };
    case 'welcome':
      return { 
        badge: 'bg-[hsl(var(--category-welcome)/0.15)] text-[hsl(var(--category-welcome))]',
        border: 'border-[hsl(var(--category-welcome)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-welcome)/0.05)]',
        icon: Smile 
      };
    case 'team':
      return { 
        badge: 'bg-[hsl(var(--category-team)/0.15)] text-[hsl(var(--category-team))]',
        border: 'border-[hsl(var(--category-team)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-team)/0.05)]',
        icon: UsersRound 
      };
    case 'feedback':
      return { 
        badge: 'bg-[hsl(var(--category-feedback)/0.15)] text-[hsl(var(--category-feedback))]',
        border: 'border-[hsl(var(--category-feedback)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-feedback)/0.05)]',
        icon: MessageSquare 
      };
    case 'training':
      return { 
        badge: 'bg-[hsl(var(--category-training)/0.15)] text-[hsl(var(--category-training))]',
        border: 'border-[hsl(var(--category-training)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-training)/0.05)]',
        icon: GraduationCap 
      };
    default:
      return { 
        badge: 'bg-[hsl(var(--category-default)/0.15)] text-[hsl(var(--category-default))]',
        border: 'border-[hsl(var(--category-default)/0.3)]',
        headerBg: 'bg-[hsl(var(--category-default)/0.05)]',
        icon: Layers 
      };
  }
};

export const BlockNode = memo(({ data }: BlockNodeProps) => {
  const { block, onEdit, stepNumber } = data;
  const { getTasksByBlockId } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);
  const categoryConfig = getCategoryConfig(block.category);
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
      {/* Top handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-card !border-2 !border-border !rounded-full !-top-1.5" 
      />
      
      <div 
        className={cn(
          "relative bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer min-w-[280px] max-w-[320px]",
          categoryConfig.border
        )}
        onClick={onEdit}
      >
        {/* Colored header strip */}
        <div className={cn("h-1.5 rounded-t-xl", categoryConfig.headerBg.replace('/0.05]', '/0.4]'))} />
        
        {/* Type badge */}
        <div className="absolute -top-3 left-4">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            categoryConfig.badge
          )}>
            <CategoryIcon className="w-3.5 h-3.5" />
            {block.category || 'Block'}
          </span>
        </div>

        {/* Step number badge */}
        {stepNumber && (
          <div className="absolute -top-3 right-4">
            <span className="text-xs text-muted-foreground font-medium">
              Step {stepNumber}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="pt-5 px-4 pb-4">
          <h3 className="text-sm font-semibold text-foreground mb-1 leading-snug">
            {block.name}
          </h3>
          
          {block.description ? (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {block.description}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/70 mb-3">
              Click to configure this block
            </p>
          )}

          {/* Tasks preview */}
          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/80 truncate">
                      {task.title}
                      {task.simpleCondition && <span className="text-destructive ml-0.5">*</span>}
                    </p>
                    {task.assigneeLabel && (
                      <p className="text-[10px] text-muted-foreground">
                        Assignee: <span className="text-foreground/70">{task.assigneeLabel}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {tasks.length > 2 && (
                <p className="text-[10px] text-muted-foreground pl-4">
                  +{tasks.length - 2} more tasks
                </p>
              )}
            </div>
          )}

          {/* Footer stats */}
          <div className="flex items-center gap-3 pt-2 border-t border-border text-xs text-muted-foreground">
            {tasks.length > 0 && (
              <span className="font-medium">{tasks.length} tasks</span>
            )}
            {block.rules.length > 0 && (
              <span className="text-[hsl(var(--category-legal))] font-medium">{block.rules.length} rules</span>
            )}
            {block.expectedDurationDays && (
              <span>{block.expectedDurationDays}d SLA</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-card !border-2 !border-border !rounded-full !-bottom-1.5" 
      />

      {/* Add button */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <button className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
});

BlockNode.displayName = 'BlockNode';
