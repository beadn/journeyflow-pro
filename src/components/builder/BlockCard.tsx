import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Clock, ListTodo, GitBranch, Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, Layers, Trash2, Link } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BlockCardProps {
  block: Block;
  onEdit: () => void;
  isDragging?: boolean;
  compact?: boolean;
}

export const getCategoryConfig = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'legal':
      return { 
        borderColor: 'border-l-[hsl(var(--category-legal))]',
        bgColor: 'bg-[hsl(var(--category-legal)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-legal))]',
        textColor: 'text-[hsl(var(--category-legal))]',
        icon: Scale 
      };
    case 'it':
      return { 
        borderColor: 'border-l-[hsl(var(--category-it))]',
        bgColor: 'bg-[hsl(var(--category-it)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-it))]',
        textColor: 'text-[hsl(var(--category-it))]',
        icon: Monitor 
      };
    case 'hr':
      return { 
        borderColor: 'border-l-[hsl(var(--category-hr))]',
        bgColor: 'bg-[hsl(var(--category-hr)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-hr))]',
        textColor: 'text-[hsl(var(--category-hr))]',
        icon: Users 
      };
    case 'welcome':
      return { 
        borderColor: 'border-l-[hsl(var(--category-welcome))]',
        bgColor: 'bg-[hsl(var(--category-welcome)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-welcome))]',
        textColor: 'text-[hsl(var(--category-welcome))]',
        icon: Smile 
      };
    case 'team':
      return { 
        borderColor: 'border-l-[hsl(var(--category-team))]',
        bgColor: 'bg-[hsl(var(--category-team)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-team))]',
        textColor: 'text-[hsl(var(--category-team))]',
        icon: UsersRound 
      };
    case 'feedback':
      return { 
        borderColor: 'border-l-[hsl(var(--category-feedback))]',
        bgColor: 'bg-[hsl(var(--category-feedback)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-feedback))]',
        textColor: 'text-[hsl(var(--category-feedback))]',
        icon: MessageSquare 
      };
    case 'training':
      return { 
        borderColor: 'border-l-[hsl(var(--category-training))]',
        bgColor: 'bg-[hsl(var(--category-training)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-training))]',
        textColor: 'text-[hsl(var(--category-training))]',
        icon: GraduationCap 
      };
    default:
      return { 
        borderColor: 'border-l-[hsl(var(--category-default))]',
        bgColor: 'bg-[hsl(var(--category-default)/0.08)]',
        dotColor: 'bg-[hsl(var(--category-default))]',
        textColor: 'text-[hsl(var(--category-default))]',
        icon: Layers 
      };
  }
};

export function BlockCard({ block, onEdit, isDragging, compact = false }: BlockCardProps) {
  const { getTasksByBlockId, deleteBlock } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);
  const categoryConfig = getCategoryConfig(block.category);
  const CategoryIcon = categoryConfig.icon;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  // Compact view - single line like calendar
  if (compact) {
    return (
      <div
        onClick={onEdit}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group",
          "hover:bg-muted/50 transition-colors",
          isDragging && "opacity-50"
        )}
      >
        {/* Category dot */}
        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", categoryConfig.dotColor)} />
        
        {/* Block info */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {block.name}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {tasks.length} tasks
          </span>
          {block.rules.length > 0 && (
            <GitBranch className="w-3 h-3 text-muted-foreground flex-shrink-0" title={`${block.rules.length} rules`} />
          )}
          {block.dependencyBlockIds.length > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 flex-shrink-0" title={`Depends on ${block.dependencyBlockIds.length} block(s)`}>
              <Link className="w-3 h-3" />
              <span>{block.dependencyBlockIds.length}</span>
            </span>
          )}
        </div>

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Block</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{block.name}"? This will also delete all {tasks.length} tasks in this block. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Full card view
  return (
    <div
      onClick={onEdit}
      className={cn(
        "block-card border-l-4 group relative",
        categoryConfig.borderColor,
        isDragging && "opacity-50 rotate-2"
      )}
    >
      {/* Delete button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{block.name}"? This will also delete all {tasks.length} tasks in this block. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-start justify-between mb-3 pr-6">
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
