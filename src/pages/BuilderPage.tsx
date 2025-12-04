import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { JourneySelector } from '@/components/builder/JourneySelector';
import { TimelineView } from '@/components/builder/TimelineView';
import { TreeView } from '@/components/builder/TreeView';
import { BlockEditorModal } from '@/components/builder/BlockEditorModal';
import { CreateJourneyModal } from '@/components/builder/CreateJourneyModal';
import { 
  LayoutGrid, 
  GitBranch, 
  Plus,
  Settings,
  Copy,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'timeline' | 'tree';

export default function BuilderPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [isCreateJourneyOpen, setIsCreateJourneyOpen] = useState(false);
  
  const { 
    journeys, 
    selectedJourneyId, 
    setSelectedJourneyId,
    selectedBlockId,
    setSelectedBlockId,
    duplicateJourney,
    deleteJourney,
    getJourneyById,
  } = useJourneyStore();

  // Set initial journey
  useEffect(() => {
    if (journeyId) {
      setSelectedJourneyId(journeyId);
    } else if (journeys.length > 0 && !selectedJourneyId) {
      setSelectedJourneyId(journeys[0].id);
      navigate(`/builder/${journeys[0].id}`, { replace: true });
    }
  }, [journeyId, journeys, selectedJourneyId, setSelectedJourneyId, navigate]);

  const selectedJourney = selectedJourneyId ? getJourneyById(selectedJourneyId) : null;

  const handleJourneySelect = (id: string) => {
    setSelectedJourneyId(id);
    navigate(`/builder/${id}`);
  };

  const handleBlockEdit = (blockId: string) => {
    setSelectedBlockId(blockId);
    setIsBlockEditorOpen(true);
  };

  const handleDuplicate = () => {
    if (selectedJourneyId) {
      const newJourney = duplicateJourney(selectedJourneyId);
      handleJourneySelect(newJourney.id);
    }
  };

  const handleDelete = () => {
    if (selectedJourneyId && journeys.length > 1) {
      deleteJourney(selectedJourneyId);
      const remaining = journeys.filter((j) => j.id !== selectedJourneyId);
      if (remaining.length > 0) {
        handleJourneySelect(remaining[0].id);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground">Journey Builder</h1>
          
          <JourneySelector
            journeys={journeys}
            selectedId={selectedJourneyId}
            onSelect={handleJourneySelect}
            onCreate={() => setIsCreateJourneyOpen(true)}
          />

          {selectedJourney && (
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize",
              selectedJourney.status === 'active' && "bg-success/10 text-success",
              selectedJourney.status === 'draft' && "bg-muted text-muted-foreground",
              selectedJourney.status === 'archived' && "bg-warning/10 text-warning",
            )}>
              {selectedJourney.status}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === 'timeline' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === 'tree' 
                  ? "bg-card text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitBranch className="w-4 h-4" />
              Tree
            </button>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => {}}>
                <Settings className="w-4 h-4 mr-2" />
                Journey Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Journey
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-danger focus:text-danger"
                disabled={journeys.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Journey
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedJourney ? (
          viewMode === 'timeline' ? (
            <TimelineView 
              journey={selectedJourney} 
              onBlockEdit={handleBlockEdit}
            />
          ) : (
            <TreeView 
              journey={selectedJourney} 
              onBlockEdit={handleBlockEdit}
            />
          )
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No journey selected</p>
              <button
                onClick={() => setIsCreateJourneyOpen(true)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Journey
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <BlockEditorModal
        isOpen={isBlockEditorOpen}
        onClose={() => {
          setIsBlockEditorOpen(false);
          setSelectedBlockId(null);
        }}
        blockId={selectedBlockId}
      />

      <CreateJourneyModal
        isOpen={isCreateJourneyOpen}
        onClose={() => setIsCreateJourneyOpen(false)}
        onCreated={handleJourneySelect}
      />
    </div>
  );
}
