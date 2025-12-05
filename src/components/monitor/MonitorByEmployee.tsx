import { useState, useMemo } from 'react';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Circle, 
  ChevronDown,
  ChevronUp,
  Play,
  SkipForward,
  Timer,
  Flag,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { EmployeeJourneyProgress, BlockProgress, Block } from '@/types/journey';

interface MonitorByEmployeeProps {
  journeyId: string | null;
}

export function MonitorByEmployee({ journeyId }: MonitorByEmployeeProps) {
  const { employees, employeeProgress, journeys, blocks, tasks } = useJourneyStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProgress, setSelectedProgress] = useState<EmployeeJourneyProgress | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const perPage = 20;

  const filteredProgress = employeeProgress.filter((p) => {
    if (journeyId && p.journeyId !== journeyId) return false;
    const emp = employees.find((e) => e.id === p.employeeId);
    if (search && emp && !emp.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProgress.length / perPage);
  const paginatedProgress = filteredProgress.slice((page - 1) * perPage, page * perPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'at_risk': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'delayed': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getBlockStatusIcon = (status: BlockProgress['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in_progress': return <Play className="w-5 h-5 text-blue-500" />;
      case 'pending': return <Circle className="w-5 h-5 text-gray-300" />;
      case 'skipped': return <SkipForward className="w-5 h-5 text-gray-400" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getBlockStatusBg = (status: BlockProgress['status'], blockId?: string) => {
    // Check if this block is at risk or delayed
    if (blockId && riskAnalysis) {
      const issue = riskAnalysis.issues.find(i => i.blockId === blockId);
      if (issue?.type === 'delayed') return 'bg-red-50 border-red-300 ring-1 ring-red-200';
      if (issue?.type === 'at_risk') return 'bg-amber-50 border-amber-300 ring-1 ring-amber-200';
    }
    
    switch (status) {
      case 'completed': return 'bg-emerald-50 border-emerald-200';
      case 'in_progress': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      case 'skipped': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getBlockRiskIndicator = (blockId: string) => {
    if (!riskAnalysis) return null;
    const issue = riskAnalysis.issues.find(i => i.blockId === blockId);
    if (!issue) return null;
    
    return issue;
  };

  const selectedEmployee = selectedProgress 
    ? employees.find(e => e.id === selectedProgress.employeeId) 
    : null;
  
  const selectedJourney = selectedProgress 
    ? journeys.find(j => j.id === selectedProgress.journeyId) 
    : null;

  // Get blocks for the selected journey, sorted by period
  const journeyBlocks = useMemo(() => {
    if (!selectedJourney) return [];
    return blocks
      .filter(b => b.journeyId === selectedJourney.id)
      .sort((a, b) => {
        const periodA = selectedJourney.periods.find(p => p.id === a.periodId);
        const periodB = selectedJourney.periods.find(p => p.id === b.periodId);
        if (!periodA || !periodB) return 0;
        if (periodA.order !== periodB.order) return periodA.order - periodB.order;
        return a.order - b.order;
      });
  }, [selectedJourney, blocks]);

  // Group blocks by period
  const blocksByPeriod = useMemo(() => {
    if (!selectedJourney) return [];
    
    const sortedPeriods = [...selectedJourney.periods].sort((a, b) => a.order - b.order);
    
    return sortedPeriods.map(period => {
      const periodBlocks = journeyBlocks.filter(b => b.periodId === period.id);
      return {
        period,
        blocks: periodBlocks
      };
    }).filter(group => group.blocks.length > 0);
  }, [selectedJourney, journeyBlocks]);

  // Calculate period progress
  const getPeriodProgress = (periodBlocks: Block[]) => {
    if (!selectedProgress || periodBlocks.length === 0) return { completed: 0, total: periodBlocks.length, percentage: 0 };
    
    const completed = periodBlocks.filter(b => 
      selectedProgress.completedBlockIds.includes(b.id)
    ).length;
    
    return {
      completed,
      total: periodBlocks.length,
      percentage: Math.round((completed / periodBlocks.length) * 100)
    };
  };

  // Get period status based on blocks
  const getPeriodStatus = (periodBlocks: Block[]): 'completed' | 'in_progress' | 'pending' => {
    if (!selectedProgress) return 'pending';
    
    const allCompleted = periodBlocks.every(b => 
      selectedProgress.completedBlockIds.includes(b.id)
    );
    if (allCompleted) return 'completed';
    
    const anyInProgress = periodBlocks.some(b => {
      const bp = selectedProgress.blockProgress.find(bp => bp.blockId === b.id);
      return bp?.status === 'in_progress';
    });
    if (anyInProgress) return 'in_progress';
    
    const anyCompleted = periodBlocks.some(b => 
      selectedProgress.completedBlockIds.includes(b.id)
    );
    if (anyCompleted) return 'in_progress';
    
    return 'pending';
  };

  const toggleBlockExpanded = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) {
        next.delete(blockId);
      } else {
        next.add(blockId);
      }
      return next;
    });
  };

  const getBlockProgress = (blockId: string): BlockProgress | undefined => {
    return selectedProgress?.blockProgress.find(bp => bp.blockId === blockId);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleCloseDetail = () => {
    setSelectedProgress(null);
    setExpandedBlocks(new Set());
  };

  // Calculate risk reasons for selected employee
  const riskAnalysis = useMemo(() => {
    if (!selectedProgress || !selectedJourney) return null;
    
    const issues: Array<{
      type: 'delayed' | 'at_risk' | 'overdue';
      blockId: string;
      blockName: string;
      daysSpent: number;
      sla: number;
      daysOver: number;
    }> = [];

    selectedProgress.blockProgress.forEach(bp => {
      if (bp.status !== 'in_progress') return;
      
      const block = blocks.find(b => b.id === bp.blockId);
      if (!block || !block.expectedDurationDays) return;
      
      const daysSpent = bp.daysSpent || 0;
      const sla = block.expectedDurationDays;
      
      if (daysSpent > sla) {
        issues.push({
          type: 'delayed',
          blockId: block.id,
          blockName: block.name,
          daysSpent,
          sla,
          daysOver: daysSpent - sla
        });
      } else if (daysSpent >= sla * 0.8) {
        issues.push({
          type: 'at_risk',
          blockId: block.id,
          blockName: block.name,
          daysSpent,
          sla,
          daysOver: 0
        });
      }
    });

    // Sort by severity (delayed first, then by days over)
    issues.sort((a, b) => {
      if (a.type === 'delayed' && b.type !== 'delayed') return -1;
      if (a.type !== 'delayed' && b.type === 'delayed') return 1;
      return b.daysOver - a.daysOver;
    });

    return {
      status: selectedProgress.status,
      issues,
      hasDelayed: issues.some(i => i.type === 'delayed'),
      hasAtRisk: issues.some(i => i.type === 'at_risk'),
      totalDaysOverdue: issues.reduce((acc, i) => acc + i.daysOver, 0)
    };
  }, [selectedProgress, selectedJourney, blocks]);

  return (
    <div className="h-full">
      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filteredProgress.length} employees</span>
        </div>

        <div className="factorial-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Employee</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Journey</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Current block</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Progress</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProgress.map((progress) => {
                const emp = employees.find((e) => e.id === progress.employeeId);
                const journey = journeys.find((j) => j.id === progress.journeyId);
                const currentBlock = blocks.find((b) => b.id === progress.currentBlockId);
                const completedPct = journey ? Math.round((progress.completedBlockIds.length / journey.blockIds.length) * 100) : 0;
                const isSelected = selectedProgress?.id === progress.id;
                
                return (
                  <tr 
                    key={progress.id} 
                    onClick={() => setSelectedProgress(isSelected ? null : progress)}
                    className={cn(
                      "border-b border-border cursor-pointer transition-all",
                      isSelected 
                        ? "bg-indigo-50 hover:bg-indigo-100" 
                        : "hover:bg-muted/30"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                          isSelected 
                            ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30" 
                            : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600"
                        )}>
                          {emp?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp?.name}</p>
                          <p className="text-xs text-muted-foreground">{emp?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{journey?.name}</td>
                    <td className="p-4 text-sm text-foreground">{currentBlock?.name || '-'}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              completedPct === 100 
                                ? "bg-emerald-500" 
                                : "bg-gradient-to-r from-indigo-500 to-indigo-400"
                            )} 
                            style={{ width: `${completedPct}%` }} 
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{completedPct}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium capitalize border",
                        getStatusColor(progress.status)
                      )}>
                        {progress.status === 'on_track' ? 'On track' :
                         progress.status === 'at_risk' ? 'At risk' :
                         progress.status === 'delayed' ? 'Delayed' :
                         progress.status === 'completed' ? 'Completed' : progress.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Side Panel */}
      <Sheet open={!!selectedProgress} onOpenChange={(open) => !open && handleCloseDetail()}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
          {selectedProgress && selectedEmployee && selectedJourney && (
            <>
              {/* Header - Compact */}
              <SheetHeader className="p-0">
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 pl-4 pr-12 py-3 text-white relative overflow-hidden">
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold flex-shrink-0">
                      {selectedEmployee.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-base font-semibold text-white truncate">{selectedEmployee.name}</SheetTitle>
                      <p className="text-white/70 text-xs">{selectedEmployee.department} · {selectedEmployee.location}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-medium capitalize border bg-white/10 border-white/20 flex-shrink-0",
                    )}>
                      {selectedProgress.status === 'on_track' ? 'On track' :
                       selectedProgress.status === 'at_risk' ? 'At risk' :
                       selectedProgress.status === 'delayed' ? 'Delayed' :
                       selectedProgress.status === 'completed' ? 'Completed' : selectedProgress.status}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              {/* Journey Progress - Compact */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  {/* Progress Stats - Inline */}
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-emerald-600">{selectedProgress.completedBlockIds.length}</span>
                      <span className="text-gray-500">done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-semibold text-blue-600">{selectedProgress.blockProgress.filter(bp => bp.status === 'in_progress').length}</span>
                      <span className="text-gray-500">active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                      <span className="font-semibold text-gray-600">{selectedProgress.blockProgress.filter(bp => bp.status === 'pending').length}</span>
                      <span className="text-gray-500">pending</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar - Compact */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ 
                          width: `${Math.round((selectedProgress.completedBlockIds.length / journeyBlocks.length) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {Math.round((selectedProgress.completedBlockIds.length / journeyBlocks.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Alert Banner */}
              {riskAnalysis && riskAnalysis.issues.length > 0 && (
                <div className={cn(
                  "px-4 py-3 border-b",
                  riskAnalysis.hasDelayed 
                    ? "bg-red-50 border-red-200" 
                    : "bg-amber-50 border-amber-200"
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      riskAnalysis.hasDelayed ? "bg-red-100" : "bg-amber-100"
                    )}>
                      {riskAnalysis.hasDelayed ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-sm font-semibold",
                        riskAnalysis.hasDelayed ? "text-red-700" : "text-amber-700"
                      )}>
                        {riskAnalysis.hasDelayed 
                          ? `Delayed: ${riskAnalysis.totalDaysOverdue} day${riskAnalysis.totalDaysOverdue !== 1 ? 's' : ''} overdue`
                          : 'At Risk: Approaching SLA limits'
                        }
                      </h4>
                      <div className="mt-2 space-y-1.5">
                        {riskAnalysis.issues.map((issue) => (
                          <div 
                            key={issue.blockId}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg text-xs",
                              issue.type === 'delayed' 
                                ? "bg-red-100/50" 
                                : "bg-amber-100/50"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                issue.type === 'delayed' ? "bg-red-500" : "bg-amber-500"
                              )} />
                              <span className={cn(
                                "font-medium truncate",
                                issue.type === 'delayed' ? "text-red-700" : "text-amber-700"
                              )}>
                                {issue.blockName}
                              </span>
                            </div>
                            <div className={cn(
                              "flex items-center gap-1 flex-shrink-0",
                              issue.type === 'delayed' ? "text-red-600" : "text-amber-600"
                            )}>
                              <Clock className="w-3 h-3" />
                              <span className="font-semibold">{issue.daysSpent}d</span>
                              <span className="text-gray-400">/</span>
                              <span>{issue.sla}d SLA</span>
                              {issue.type === 'delayed' && (
                                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold">
                                  +{issue.daysOver}d
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blocks Timeline - Grouped by Period */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-6">
                  {blocksByPeriod.map(({ period, blocks: periodBlocks }, periodIndex) => {
                    const periodProgress = getPeriodProgress(periodBlocks);
                    const periodStatus = getPeriodStatus(periodBlocks);
                    
                    return (
                      <div key={period.id} className="relative">
                        {/* Period connector line */}
                        {periodIndex < blocksByPeriod.length - 1 && (
                          <div className={cn(
                            "absolute left-4 top-[60px] w-0.5 bottom-[-24px]",
                            periodStatus === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'
                          )} />
                        )}
                        
                        {/* Period Header */}
                        <div className={cn(
                          "relative flex items-center gap-3 p-3 rounded-xl mb-3 transition-all",
                          periodStatus === 'completed' 
                            ? "bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200" 
                            : periodStatus === 'in_progress'
                            ? "bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200"
                            : "bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200"
                        )}>
                          {/* Period Icon */}
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            periodStatus === 'completed' 
                              ? "bg-emerald-500 text-white" 
                              : periodStatus === 'in_progress'
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300 text-white"
                          )}>
                            {periodStatus === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : periodStatus === 'in_progress' ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <Timer className="w-4 h-4" />
                            )}
                          </div>
                          
                          {/* Period Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={cn(
                                "font-semibold text-sm",
                                periodStatus === 'completed' 
                                  ? "text-emerald-700" 
                                  : periodStatus === 'in_progress'
                                  ? "text-blue-700"
                                  : "text-gray-700"
                              )}>
                                {period.label}
                              </h4>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                periodStatus === 'completed' 
                                  ? "bg-emerald-200 text-emerald-700" 
                                  : periodStatus === 'in_progress'
                                  ? "bg-blue-200 text-blue-700"
                                  : "bg-gray-200 text-gray-600"
                              )}>
                                Day {period.offsetDays}
                              </span>
                            </div>
                            
                            {/* Period Progress */}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden max-w-[120px]">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    periodStatus === 'completed' 
                                      ? "bg-emerald-500" 
                                      : "bg-blue-500"
                                  )} 
                                  style={{ width: `${periodProgress.percentage}%` }} 
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {periodProgress.completed}/{periodProgress.total} blocks
                              </span>
                            </div>
                          </div>
                          
                          {/* Period Status Badge */}
                          {periodStatus === 'completed' && (
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                              ✓ Complete
                            </span>
                          )}
                          {periodStatus === 'in_progress' && (
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              In progress
                            </span>
                          )}
                        </div>
                        
                        {/* Period Blocks */}
                        <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-4">
                          {periodBlocks.map((block) => {
                            const blockProgress = getBlockProgress(block.id);
                            const status = blockProgress?.status || 'pending';
                            const blockTasks = tasks.filter(t => t.blockId === block.id).sort((a, b) => a.order - b.order);
                            const isExpanded = expandedBlocks.has(block.id);
                            const riskIndicator = getBlockRiskIndicator(block.id);
                            
                            return (
                              <div key={block.id} className="relative pl-4">
                                {/* Block connector dot */}
                                <div className={cn(
                                  "absolute -left-[5px] top-5 w-2 h-2 rounded-full border-2 border-white",
                                  riskIndicator?.type === 'delayed' ? 'bg-red-500' :
                                  riskIndicator?.type === 'at_risk' ? 'bg-amber-500' :
                                  status === 'completed' ? 'bg-emerald-500' :
                                  status === 'in_progress' ? 'bg-blue-500' :
                                  'bg-gray-300'
                                )} />
                                
                                {/* Block Card */}
                                <div 
                                  className={cn(
                                    "border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md",
                                    getBlockStatusBg(status, block.id),
                                    isExpanded && "shadow-md"
                                  )}
                                  onClick={() => toggleBlockExpanded(block.id)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                      {riskIndicator?.type === 'delayed' ? (
                                        <AlertCircle className="w-5 h-5 text-red-500" />
                                      ) : riskIndicator?.type === 'at_risk' ? (
                                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                                      ) : (
                                        getBlockStatusIcon(status)
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-medium text-gray-900 text-sm">{block.name}</h5>
                                          {riskIndicator && (
                                            <span className={cn(
                                              "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                              riskIndicator.type === 'delayed' 
                                                ? "bg-red-500 text-white" 
                                                : "bg-amber-500 text-white"
                                            )}>
                                              {riskIndicator.type === 'delayed' 
                                                ? `+${riskIndicator.daysOver}d overdue` 
                                                : 'At risk'
                                              }
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {blockProgress?.daysSpent !== undefined && blockProgress.daysSpent > 0 && (
                                            <span className={cn(
                                              "text-xs flex items-center gap-1",
                                              riskIndicator?.type === 'delayed' ? "text-red-600 font-semibold" :
                                              riskIndicator?.type === 'at_risk' ? "text-amber-600 font-semibold" :
                                              "text-gray-500"
                                            )}>
                                              <Clock className="w-3 h-3" />
                                              {blockProgress.daysSpent}d
                                              {block.expectedDurationDays && (
                                                <span className="text-gray-400">/{block.expectedDurationDays}d</span>
                                              )}
                                            </span>
                                          )}
                                          <button className="p-1 hover:bg-black/5 rounded transition-colors">
                                            {isExpanded ? (
                                              <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                              <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Status & dates row */}
                                      {(blockProgress?.startedAt || blockProgress?.completedAt) && (
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                          {blockProgress.startedAt && (
                                            <span>Started: {formatDate(blockProgress.startedAt)}</span>
                                          )}
                                          {blockProgress.completedAt && (
                                            <span className="text-emerald-600">
                                              ✓ {formatDate(blockProgress.completedAt)}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expanded: Tasks list */}
                                  {isExpanded && blockTasks.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200/50">
                                      <h6 className="text-xs font-medium text-gray-500 uppercase mb-2">
                                        Tasks ({blockTasks.length})
                                      </h6>
                                      <div className="space-y-1.5">
                                        {blockTasks.map((task, taskIndex) => {
                                          const isTaskCompleted = status === 'completed' || 
                                            (status === 'in_progress' && taskIndex < Math.floor(blockTasks.length / 2));
                                          const isTaskInProgress = status === 'in_progress' && 
                                            taskIndex === Math.floor(blockTasks.length / 2);
                                          
                                          return (
                                            <div 
                                              key={task.id}
                                              className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg text-sm",
                                                isTaskCompleted ? "bg-emerald-50/50" :
                                                isTaskInProgress ? "bg-blue-50/50" :
                                                "bg-gray-50/50"
                                              )}
                                            >
                                              {isTaskCompleted ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                              ) : isTaskInProgress ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
                                              ) : (
                                                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                              )}
                                              <span className={cn(
                                                "flex-1 text-xs",
                                                isTaskCompleted ? "text-gray-500 line-through" : "text-gray-700"
                                              )}>
                                                {task.title}
                                              </span>
                                              <span className="text-xs text-gray-400 capitalize">
                                                {task.assigneeType}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Expanded: No tasks message */}
                                  {isExpanded && blockTasks.length === 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200/50 text-center text-xs text-gray-400">
                                      No tasks in this block
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Journey End Marker */}
                  {blocksByPeriod.length > 0 && (
                    <div className="flex items-center gap-3 pl-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Flag className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-400">Journey End</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
