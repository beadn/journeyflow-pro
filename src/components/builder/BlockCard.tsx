import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Clock, ListTodo, GitBranch } from 'lucide-react';

interface BlockCardProps {
  block: Block;
  onEdit: () => void;
  isDragging?: boolean;
}

export function BlockCard({ block, onEdit, isDragging }: BlockCardProps) {
  const { getTasksByBlockId } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);

  return (
    <div
      onClick={onEdit}
      className={cn(
        "block-card",
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
    </div>
  );
}
