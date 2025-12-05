import { useState } from 'react';
import { Period, Block } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { BlockCard } from './BlockCard';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { Plus, Trash2, Clock } from 'lucide-react';

interface PeriodColumnProps {
  period: Period;
  journeyId: string;
  blocks: Block[];
  layout: 'horizontal' | 'vertical';
  onBlockEdit: (blockId: string) => void;
  onAddBlock: () => void;
  compact?: boolean;
}

export function PeriodColumn({
  period,
  journeyId,
  blocks,
  layout,
  onBlockEdit,
  onAddBlock,
  compact = false,
}: PeriodColumnProps) {
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [isEditingOffset, setIsEditingOffset] = useState(false);
  const { updatePeriod, deletePeriod } = useJourneyStore();

  const { setNodeRef, isOver } = useDroppable({
    id: period.id,
  });

  const handleLabelChange = (label: string) => {
    updatePeriod(journeyId, period.id, { label });
  };

  const handleOffsetChange = (offsetDays: number) => {
    updatePeriod(journeyId, period.id, { offsetDays });
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "timeline-period bg-card rounded-xl border border-border",
        layout === 'horizontal' 
          ? compact ? 'min-w-[280px] w-[280px]' : 'min-w-[300px] w-[300px]' 
          : 'w-full',
        isOver && 'ring-2 ring-accent'
      )}
    >
      {/* Period Header */}
      <div className={cn(
        "border-b border-border flex items-center gap-2",
        compact ? "px-3 py-2" : "p-4"
      )}>
        <div className={cn(
          "bg-muted rounded-lg flex-shrink-0",
          compact ? "p-1" : "p-1.5"
        )}>
          <Clock className={cn("text-muted-foreground", compact ? "w-3 h-3" : "w-4 h-4")} />
        </div>

        <div className="flex-1 min-w-0">
          {isEditingLabel ? (
            <input
              type="text"
              value={period.label}
              onChange={(e) => handleLabelChange(e.target.value)}
              onBlur={() => setIsEditingLabel(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingLabel(false)}
              autoFocus
              className={cn(
                "w-full px-2 rounded border border-border bg-background font-medium focus:outline-none focus:ring-2 focus:ring-ring",
                compact ? "h-6 text-xs" : "h-7 text-sm"
              )}
            />
          ) : (
            <button
              onClick={() => setIsEditingLabel(true)}
              className={cn(
                "font-semibold text-foreground hover:text-accent transition-colors truncate block",
                compact ? "text-xs" : "text-sm"
              )}
            >
              {period.label}
            </button>
          )}

          {!compact && (
            isEditingOffset ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={period.offsetDays}
                  onChange={(e) => handleOffsetChange(parseInt(e.target.value) || 0)}
                  onBlur={() => setIsEditingOffset(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingOffset(false)}
                  autoFocus
                  className="w-16 h-6 px-2 rounded border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingOffset(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {period.offsetDays >= 0 ? '+' : ''}{period.offsetDays} days from anchor
              </button>
            )
          )}
        </div>

        {compact && (
          <span className="text-[10px] text-muted-foreground flex-shrink-0">
            {period.offsetDays >= 0 ? '+' : ''}{period.offsetDays}d
          </span>
        )}

        <button
          onClick={() => deletePeriod(journeyId, period.id)}
          className={cn(
            "hover:bg-danger/10 rounded-lg transition-colors group flex-shrink-0",
            compact ? "p-1" : "p-1.5"
          )}
        >
          <Trash2 className={cn("text-muted-foreground group-hover:text-danger", compact ? "w-3 h-3" : "w-4 h-4")} />
        </button>
      </div>

      {/* Blocks */}
      <div className={cn(
        compact ? "p-2 space-y-0.5 min-h-[100px]" : "p-3 space-y-3 min-h-[200px]"
      )}>
        {sortedBlocks.map((block) => (
          <BlockCard
            key={block.id}
            block={block}
            onEdit={() => onBlockEdit(block.id)}
            compact={compact}
          />
        ))}

        <button
          onClick={onAddBlock}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground hover:border-accent hover:text-accent transition-colors",
            compact ? "p-2" : "p-4"
          )}
        >
          <Plus className={cn(compact ? "w-3 h-3" : "w-4 h-4")} />
          <span className={cn(compact ? "text-xs" : "text-sm")}>Add Block</span>
        </button>
      </div>
    </div>
  );
}
