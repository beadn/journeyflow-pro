import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { TimelineView } from '@/components/builder/TimelineView';
import { TreeView } from '@/components/builder/TreeView';
import { BlockEditorModal } from '@/components/builder/BlockEditorModal';
import { JourneyPreviewModal } from '@/components/builder/JourneyPreviewModal';
import { MonitorByEmployee } from '@/components/monitor/MonitorByEmployee';
import { MonitorByJourney } from '@/components/monitor/MonitorByJourney';
import { MonitorByBlock } from '@/components/monitor/MonitorByBlock';
import { JourneyHealthOverview } from '@/components/monitor/JourneyHealthOverview';
import { 
  LayoutGrid, 
  GitBranch, 
  Settings,
  Copy,
  Trash2,
  MoreHorizontal,
  ArrowLeft,
  Activity,
  Users,
  BarChart3,
  Pencil,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MainTab = 'builder' | 'monitor';
type BuilderView = 'timeline' | 'tree';
type MonitorView = 'overview' | 'employee' | 'journey' | 'block';

const formatAnchorEvent = (anchor: string) => {
  const labels: Record<string, string> = {
    'start_date': 'Employee Start Date',
    'last_day': 'Last Working Day',
    'promotion_date': 'Promotion Date',
    'cycle_start': 'Cycle Start',
    'custom': 'Custom Event',
  };
  return labels[anchor] || anchor;
};

export default function JourneyPage() {
  const { journeyId } = useParams();
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<MainTab>('builder');
  const [builderView, setBuilderView] = useState<BuilderView>('timeline');
  const [monitorView, setMonitorView] = useState<MonitorView>('overview');
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { 
    journeys,
    selectedBlockId,
    setSelectedBlockId,
    duplicateJourney,
    deleteJourney,
    getJourneyById,
  } = useJourneyStore();

  const journey = journeyId ? getJourneyById(journeyId) : null;

  useEffect(() => {
    if (journeyId && !journey) {
      navigate('/workflows');
    }
  }, [journeyId, journey, navigate]);

  const handleBlockEdit = (blockId: string) => {
    setSelectedBlockId(blockId);
    setIsBlockEditorOpen(true);
  };

  const handleDuplicate = () => {
    if (journeyId) {
      const newJourney = duplicateJourney(journeyId);
      navigate(`/journey/${newJourney.id}`);
    }
  };

  const handleDelete = () => {
    if (journeyId && journeys.length > 1) {
      deleteJourney(journeyId);
      navigate('/workflows');
    }
  };

  if (!journey) {
    return null;
  }

  const monitorViews = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'employee' as const, label: 'By Employee', icon: Users },
    { id: 'block' as const, label: 'By Block', icon: LayoutGrid },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/workflows')}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-foreground">{journey.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="capitalize">{journey.type.replace('_', ' ')}</span>
                <span className="text-border">•</span>
                <span>Anchor: <span className="font-medium text-foreground">{formatAnchorEvent(journey.anchorEvent)}</span></span>
              </p>
            </div>

            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium capitalize",
              journey.status === 'active' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              journey.status === 'draft' && "bg-muted text-muted-foreground",
              journey.status === 'archived' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            )}>
              {journey.status}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Main tab toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setMainTab('builder')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  mainTab === 'builder' 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Pencil className="w-4 h-4" />
                Builder
              </button>
              <button
                onClick={() => setMainTab('monitor')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  mainTab === 'monitor' 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Activity className="w-4 h-4" />
                Monitor
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
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                  disabled={journeys.length <= 1}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Sub-navigation based on main tab */}
        <div className="px-6 pb-3">
          {mainTab === 'builder' && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">View:</span>
                <button
                  onClick={() => setBuilderView('timeline')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    builderView === 'timeline' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Timeline
                </button>
                <button
                  onClick={() => setBuilderView('tree')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    builderView === 'tree' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Tree
                </button>
              </div>
              
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          )}
          {mainTab === 'monitor' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">View:</span>
              {monitorViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setMonitorView(view.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    monitorView === view.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <view.icon className="w-3.5 h-3.5" />
                  {view.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
        {mainTab === 'builder' && (
          <>
            {builderView === 'timeline' ? (
              <TimelineView journey={journey} onBlockEdit={handleBlockEdit} />
            ) : (
              <TreeView journey={journey} onBlockEdit={handleBlockEdit} />
            )}
          </>
        )}
        {mainTab === 'monitor' && (
          <div className="h-full overflow-auto p-6">
            {monitorView === 'overview' && <JourneyHealthOverview journeyId={journeyId!} />}
            {monitorView === 'employee' && <MonitorByEmployee journeyId={journeyId!} />}
            {monitorView === 'block' && <MonitorByBlock journeyId={journeyId!} />}
          </div>
        )}
      </div>

      {/* Block Editor Modal */}
      <BlockEditorModal
        isOpen={isBlockEditorOpen}
        onClose={() => {
          setIsBlockEditorOpen(false);
          setSelectedBlockId(null);
        }}
        blockId={selectedBlockId}
      />

      {/* Journey Preview Modal */}
      <JourneyPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        journey={journey}
      />
    </div>
  );
}
