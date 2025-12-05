import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Plus, Scale, Monitor, Users, Smile, UsersRound, MessageSquare, GraduationCap, Layers, Trash2, GitBranch } from 'lucide-react';
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
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: Scale 
      };
    case 'it':
      return { 
        badge: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: Monitor 
      };
    case 'hr':
      return { 
        badge: 'bg-purple-100 text-purple-700 border-purple-200',
        icon: Users 
      };
    case 'welcome':
      return { 
        badge: 'bg-amber-100 text-amber-700 border-amber-200',
        icon: Smile 
      };
    case 'team':
      return { 
        badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        icon: UsersRound 
      };
    case 'feedback':
      return { 
        badge: 'bg-pink-100 text-pink-700 border-pink-200',
        icon: MessageSquare 
      };
    case 'training':
      return { 
        badge: 'bg-violet-100 text-violet-700 border-violet-200',
        icon: GraduationCap 
      };
    default:
      return { 
        badge: 'bg-muted text-muted-foreground border-border',
        icon: Layers 
      };
  }
};

export const BlockNode = memo(({ data }: BlockNodeProps) => {
  const { block, onEdit, stepNumber } = data;
  const { getTasksByBlockId, deleteBlock } = useJourneyStore();
  const tasks = getTasksByBlockId(block.id);
  const categoryConfig = getCategoryConfig(block.category);
  const CategoryIcon = categoryConfig.icon;
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  return (
    <>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!w-3 !h-3 !bg-background !border-2 !border-primary !rounded-full !-top-1.5" 
      />
      
      <div 
        className={cn(
          "relative bg-card rounded-xl border-2 shadow-md hover:shadow-lg transition-all cursor-pointer min-w-[280px] max-w-[320px] group",
          isHovered ? "border-primary" : "border-border"
        )}
        onClick={onEdit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Category badge */}
        <div className="absolute -top-3 left-4 z-10">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
            categoryConfig.badge
          )}>
            <CategoryIcon className="w-3.5 h-3.5" />
            {block.category || 'Block'}
          </span>
        </div>

        {/* Step number */}
        {stepNumber && (
          <div className="absolute -top-3 right-4 z-10">
            <span className="text-xs text-muted-foreground font-medium bg-card px-2 py-0.5 rounded-full border border-border">
              Step {stepNumber}
            </span>
          </div>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute top-3 right-3 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all z-10",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Block</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{block.name}"? This will also delete the {tasks.length} tasks in this block.
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

        {/* Content */}
        <div className="pt-6 px-4 pb-4">
          <h3 className="text-sm font-bold text-foreground mb-1 leading-snug pr-6">
            {block.name}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-3">
            {block.description || 'Click to configure'}
          </p>

          {/* Tasks preview */}
          {tasks.length > 0 && (
            <div className="space-y-2 mb-3">
              {tasks.slice(0, 2).map((task) => (
                <div key={task.id} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/80 truncate">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {task.assigneeType}
                    </p>
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
          <div className="flex items-center gap-3 pt-3 border-t border-border text-xs">
            <span className="font-semibold text-foreground">{tasks.length} tasks</span>
            {block.rules.length > 0 && (
              <span className="flex items-center gap-1 text-primary font-medium">
                <GitBranch className="w-3 h-3" />
                {block.rules.length} rules
              </span>
            )}
            {block.expectedDurationDays && (
              <span className="text-muted-foreground">{block.expectedDurationDays}d SLA</span>
            )}
          </div>
        </div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-background !border-2 !border-primary !rounded-full !-bottom-1.5" 
      />

      {/* Add button below */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <button className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all shadow-sm">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
});

BlockNode.displayName = 'BlockNode';