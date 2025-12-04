import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Clock, ListTodo, GitBranch, Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, Layers } from 'lucide-react';

interface BlockCardProps {
  block: Block;
  onEdit: () => void;
  isDragging?: boolean;
}

const getCategoryConfig = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'legal':
      return { 
        borderColor: 'border-l-[hsl(var(--category-legal))]',
        bgColor: 'bg-[hsl(var(--category-legal)/0.08)]',
        textColor: 'text-[hsl(var(--category-legal))]',
        icon: Scale 
      };
    case 'it':
      return { 
        borderColor: 'border-l-[hsl(var(--category-it))]',
        bgColor: 'bg-[hsl(var(--category-it)/0.08)]',
        textColor: 'text-[hsl(var(--category-it))]',
        icon: Monitor 
      };
    case 'hr':
      return { 
        borderColor: 'border-l-[hsl(var(--category-hr))]',
        bgColor: 'bg-[hsl(var(--category-hr)/0.08)]',
        textColor: 'text-[hsl(var(--category-hr))]',
        icon: Users 
      };
    case 'welcome':
      return { 
        borderColor: 'border-l-[hsl(var(--category-welcome))]',
        bgColor: 'bg-[hsl(var(--category-welcome)/0.08)]',
        textColor: 'text-[hsl(var(--category-welcome))]',
        icon: Smile 
      };
    case 'team':
      return { 
        borderColor: 'border-l-[hsl(var(--category-team))]',
        bgColor: 'bg-[hsl(var(--category-team)/0.08)]',
        textColor: 'text-[hsl(var(--category-team))]',
        icon: UsersRound 
      };
    case 'feedback':
      return { 
        borderColor: 'border-l-[hsl(var(--category-feedback))]',
        bgColor: 'bg-[hsl(var(--category-feedback)/0.08)]',
        textColor: 'text-[hsl(var(--category-feedback))]',
        icon: MessageSquare 
      };
    case 'training':
      return { 
        borderColor: 'border-l-[hsl(var(--category-training))]',
        bgColor: 'bg-[hsl(var(--category-training)/0.08)]',
        textColor: 'text-[hsl(var(--category-training))]',
        icon: GraduationCap 
      };
    default:
      return { 
        borderColor: 'border-l-[hsl(var(--category-default))]',
        bgColor: 'bg-[hsl(var(--category-default)/0.08)]',
        textColor: 'text-[hsl(var(--category-default))]',
        icon: Layers 
      };
  }
};

export function BlockCard({ block, onEdit, isDragging }: BlockCardProps) {
  const { getTasksByBlockId } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);
  const categoryConfig = getCategoryConfig(block.category);
  const CategoryIcon = categoryConfig.icon;

  return (
    <div
      onClick={onEdit}
      className={cn(
        "block-card border-l-4",
        categoryConfig.borderColor,
        isDragging && "opacity-50 rotate-2"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm leading-tight">{block.name}</h4>
          {block.category && (
            <span className={cn(
              "inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-full",
              categoryConfig.bgColor,
              categoryConfig.textColor
            )}>
              <CategoryIcon className="w-3 h-3" />
              {block.category}
            </span>
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
