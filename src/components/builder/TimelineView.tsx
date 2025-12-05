import { useState, useCallback } from 'react';
import { Journey, Block, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { BlockCard } from './BlockCard';
import { PeriodColumn } from './PeriodColumn';
import { AddBlockModal } from './AddBlockModal';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, ArrowUpDown, Plus, Clock, List, LayoutGrid } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TimelineViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

interface AddPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (label: string, offsetDays: number) => void;
  suggestedOffset: number;
  insertPosition: 'start' | 'end' | 'between';
  beforePeriod?: Period;
  afterPeriod?: Period;
}

function AddPeriodModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  suggestedOffset,
  insertPosition,
  beforePeriod,
  afterPeriod 
}: AddPeriodModalProps) {
  const [label, setLabel] = useState('');
  const [offsetDays, setOffsetDays] = useState(suggestedOffset);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLabel = label.trim() || `Day ${offsetDays}`;
    onAdd(finalLabel, offsetDays);
    setLabel('');
    setOffsetDays(suggestedOffset);
    onClose();
  };

  // Calculate min/max based on position
  let minOffset = -365;
  let maxOffset = 365;
  
  if (insertPosition === 'between') {
    if (afterPeriod) minOffset = afterPeriod.offsetDays + 1;
    if (beforePeriod) maxOffset = beforePeriod.offsetDays - 1;
  } else if (insertPosition === 'start' && beforePeriod) {
    maxOffset = beforePeriod.offsetDays - 1;
  } else if (insertPosition === 'end' && afterPeriod) {
    minOffset = afterPeriod.offsetDays + 1;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            Add Period
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Position indicator */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            {insertPosition === 'start' && (
              <span className="text-muted-foreground">
                Adding before <span className="font-medium text-foreground">{beforePeriod?.label}</span>
              </span>
            )}
            {insertPosition === 'end' && (
              <span className="text-muted-foreground">
                Adding after <span className="font-medium text-foreground">{afterPeriod?.label}</span>
              </span>
            )}
            {insertPosition === 'between' && (
              <span className="text-muted-foreground">
                Adding between <span className="font-medium text-foreground">{afterPeriod?.label}</span> and <span className="font-medium text-foreground">{beforePeriod?.label}</span>
              </span>
            )}
          </div>

          {/* Period name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Period Name
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`Day ${offsetDays}`}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Offset days */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Days from Anchor Event
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={offsetDays}
                onChange={(e) => setOffsetDays(parseInt(e.target.value) || 0)}
                min={minOffset}
                max={maxOffset}
                className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {offsetDays >= 0 ? `+${offsetDays}` : offsetDays} days
              </span>
            </div>
            {insertPosition === 'between' && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Range: {minOffset} to {maxOffset} days
              </p>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-xs text-muted-foreground mb-2">
              Quick presets
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Day 0', days: 0 },
                { label: 'Week 1', days: 7 },
                { label: 'Week 2', days: 14 },
                { label: 'Month 1', days: 30 },
                { label: 'Month 2', days: 60 },
                { label: 'Month 3', days: 90 },
              ]
                .filter(p => p.days >= minOffset && p.days <= maxOffset)
                .map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setLabel(preset.label);
                      setOffsetDays(preset.days);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-full border transition-colors",
                      offsetDays === preset.days
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border hover:border-accent hover:text-accent"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              Add Period
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Insert button between periods
function InsertPeriodButton({ onClick, layout }: { onClick: () => void; layout: 'horizontal' | 'vertical' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center justify-center transition-all",
        layout === 'horizontal' 
          ? "w-8 hover:w-12 self-stretch" 
          : "h-8 hover:h-12 w-full"
      )}
    >
      <div className={cn(
        "flex items-center justify-center rounded-full bg-muted border-2 border-dashed border-border",
        "group-hover:border-accent group-hover:bg-accent/10 transition-colors",
        "w-6 h-6"
      )}>
        <Plus className="w-3 h-3 text-muted-foreground group-hover:text-accent" />
      </div>
    </button>
  );
}

export function TimelineView({ journey, onBlockEdit }: TimelineViewProps) {
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [density, setDensity] = useState<'compact' | 'expanded'>('compact');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addBlockModal, setAddBlockModal] = useState<{ isOpen: boolean; periodId: string | null }>({
    isOpen: false,
    periodId: null,
  });
  const [addPeriodModal, setAddPeriodModal] = useState<{
    isOpen: boolean;
    suggestedOffset: number;
    insertPosition: 'start' | 'end' | 'between';
    beforePeriod?: Period;
    afterPeriod?: Period;
  }>({
    isOpen: false,
    suggestedOffset: 0,
    insertPosition: 'end',
  });
  
  const { 
    getBlocksByPeriodId, 
    moveBlockToPeriod, 
    addPeriod,
  } = useJourneyStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Only allow dragging blocks to periods
    if (activeId.startsWith('block-') && overId.startsWith('period-')) {
      moveBlockToPeriod(activeId, overId);
    }
  };

  const handleAddBlock = useCallback((periodId: string) => {
    setAddBlockModal({ isOpen: true, periodId });
  }, []);

  const handleBlockCreated = useCallback((blockId: string) => {
    onBlockEdit(blockId);
  }, [onBlockEdit]);

  // Sort periods by offsetDays (timeline order)
  const sortedPeriods = [...journey.periods].sort((a, b) => a.offsetDays - b.offsetDays);

  const handleOpenAddPeriodModal = useCallback((
    insertPosition: 'start' | 'end' | 'between',
    beforePeriod?: Period,
    afterPeriod?: Period
  ) => {
    let suggestedOffset = 0;
    
    if (insertPosition === 'start' && beforePeriod) {
      suggestedOffset = beforePeriod.offsetDays - 7;
    } else if (insertPosition === 'end' && afterPeriod) {
      suggestedOffset = afterPeriod.offsetDays + 7;
    } else if (insertPosition === 'between' && beforePeriod && afterPeriod) {
      suggestedOffset = Math.floor((beforePeriod.offsetDays + afterPeriod.offsetDays) / 2);
    }
    
    setAddPeriodModal({
      isOpen: true,
      suggestedOffset,
      insertPosition,
      beforePeriod,
      afterPeriod,
    });
  }, []);

  const handleAddPeriod = useCallback((label: string, offsetDays: number) => {
    const newPeriod: Period = {
      id: `period-${Date.now()}`,
      label,
      offsetDays,
      order: journey.periods.length,
    };
    addPeriod(journey.id, newPeriod);
  }, [journey, addPeriod]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-4">
          {/* Layout toggle */}
          <div className="flex items-center gap-1.5 bg-card rounded-lg p-1 border border-border shadow-sm">
            <button
              onClick={() => setLayout('horizontal')}
              title="Horizontal layout"
              className={cn(
                "p-1.5 rounded-md transition-all",
                layout === 'horizontal' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('vertical')}
              title="Vertical layout"
              className={cn(
                "p-1.5 rounded-md transition-all",
                layout === 'vertical' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-border" />

          {/* Density toggle */}
          <div className="flex items-center gap-1.5 bg-card rounded-lg p-1 border border-border shadow-sm">
            <button
              onClick={() => setDensity('compact')}
              title="Compact view"
              className={cn(
                "p-1.5 rounded-md transition-all",
                density === 'compact' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDensity('expanded')}
              title="Expanded view"
              className={cn(
                "p-1.5 rounded-md transition-all",
                density === 'expanded' 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className={cn(
        "flex-1 overflow-auto p-6 custom-scrollbar",
        layout === 'horizontal' ? "overflow-x-auto" : "overflow-y-auto"
      )}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className={cn(
            "flex gap-0 items-stretch",
            layout === 'vertical' && "flex-col"
          )}>
            {/* Insert at start button */}
            {sortedPeriods.length > 0 && (
              <InsertPeriodButton 
                layout={layout}
                onClick={() => handleOpenAddPeriodModal('start', sortedPeriods[0], undefined)} 
              />
            )}

            {sortedPeriods.map((period, index) => {
              const blocks = getBlocksByPeriodId(period.id);
              const nextPeriod = sortedPeriods[index + 1];
              
              return (
                <div 
                  key={period.id} 
                  className={cn(
                    "flex items-stretch",
                    layout === 'vertical' && "flex-col"
                  )}
                >
                  <PeriodColumn
                    period={period}
                    journeyId={journey.id}
                    blocks={blocks}
                    layout={layout}
                    onBlockEdit={onBlockEdit}
                    onAddBlock={() => handleAddBlock(period.id)}
                    compact={density === 'compact'}
                  />
                  
                  {/* Insert between periods button */}
                  {nextPeriod && (
                    <InsertPeriodButton 
                      layout={layout}
                      onClick={() => handleOpenAddPeriodModal('between', nextPeriod, period)} 
                    />
                  )}
                </div>
              );
            })}

            {/* Insert at end button (when there are periods) */}
            {sortedPeriods.length > 0 && (
              <InsertPeriodButton 
                layout={layout}
                onClick={() => handleOpenAddPeriodModal('end', undefined, sortedPeriods[sortedPeriods.length - 1])} 
              />
            )}

            {/* Empty state */}
            {sortedPeriods.length === 0 && (
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No periods yet</p>
                  <button
                    onClick={() => handleOpenAddPeriodModal('end', undefined, undefined)}
                    className="btn-primary"
                  >
                    + Add First Period
                  </button>
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeId && activeId.startsWith('block-') && (
              <div className="opacity-80">
                <BlockCard
                  block={useJourneyStore.getState().blocks.find((b) => b.id === activeId)!}
                  onEdit={() => {}}
                  compact={density === 'compact'}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Block Modal */}
      {addBlockModal.periodId && (
        <AddBlockModal
          isOpen={addBlockModal.isOpen}
          onClose={() => setAddBlockModal({ isOpen: false, periodId: null })}
          journeyId={journey.id}
          periodId={addBlockModal.periodId}
          onBlockCreated={handleBlockCreated}
        />
      )}

      {/* Add Period Modal */}
      <AddPeriodModal
        isOpen={addPeriodModal.isOpen}
        onClose={() => setAddPeriodModal(prev => ({ ...prev, isOpen: false }))}
        onAdd={handleAddPeriod}
        suggestedOffset={addPeriodModal.suggestedOffset}
        insertPosition={addPeriodModal.insertPosition}
        beforePeriod={addPeriodModal.beforePeriod}
        afterPeriod={addPeriodModal.afterPeriod}
      />
    </div>
  );
}
