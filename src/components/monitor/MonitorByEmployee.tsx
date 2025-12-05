import { useState, useMemo } from 'react';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  Circle, 
  MapPin, 
  Calendar, 
  User, 
  Mail,
  ChevronDown,
  ChevronUp,
  Play,
  SkipForward,
  Timer,
  Flag
} from 'lucide-react';
import { EmployeeJourneyProgress, BlockProgress, Period, Block } from '@/types/journey';

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

  const getBlockStatusBg = (status: BlockProgress['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 border-emerald-200';
      case 'in_progress': return 'bg-blue-50 border-blue-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      case 'skipped': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-50 border-gray-200';
    }
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
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Main Table */}
      <div className={cn(
        "flex-1 space-y-4 transition-all duration-300",
        selectedProgress ? "w-1/2" : "w-full"
      )}>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <span className="text-sm text-muted-foreground">{filteredProgress.length} empleados</span>
        </div>

        <div className="factorial-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Empleado</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Journey</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Bloque actual</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Progreso</th>
                <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Estado</th>
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
                        {progress.status === 'on_track' ? 'En tiempo' :
                         progress.status === 'at_risk' ? 'En riesgo' :
                         progress.status === 'delayed' ? 'Retrasado' :
                         progress.status === 'completed' ? 'Completado' : progress.status}
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
            <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
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

      {/* Detail Panel */}
      {selectedProgress && selectedEmployee && selectedJourney && (
        <div className="w-[500px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <button 
              onClick={() => setSelectedProgress(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="relative flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold shadow-lg">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedEmployee.name}</h2>
                <p className="text-white/80 text-sm">{selectedEmployee.department}</p>
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 truncate">{selectedEmployee.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedEmployee.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{selectedEmployee.manager}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{formatDate(selectedEmployee.startDate)}</span>
              </div>
            </div>
          </div>

          {/* Journey Progress */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{selectedJourney.name}</h3>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium capitalize border",
                getStatusColor(selectedProgress.status)
              )}>
                {selectedProgress.status === 'on_track' ? 'En tiempo' :
                 selectedProgress.status === 'at_risk' ? 'En riesgo' :
                 selectedProgress.status === 'delayed' ? 'Retrasado' :
                 selectedProgress.status === 'completed' ? 'Completado' : selectedProgress.status}
              </span>
            </div>
            
            {/* Progress Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {selectedProgress.completedBlockIds.length}
                </div>
                <div className="text-xs text-emerald-600/70">Completados</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedProgress.blockProgress.filter(bp => bp.status === 'in_progress').length}
                </div>
                <div className="text-xs text-blue-600/70">En progreso</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {selectedProgress.blockProgress.filter(bp => bp.status === 'pending').length}
                </div>
                <div className="text-xs text-gray-600/70">Pendientes</div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                style={{ 
                  width: `${Math.round((selectedProgress.completedBlockIds.length / journeyBlocks.length) * 100)}%` 
                }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Inicio: {formatDate(selectedProgress.startedAt)}</span>
              <span>{Math.round((selectedProgress.completedBlockIds.length / journeyBlocks.length) * 100)}% completado</span>
            </div>
          </div>

          {/* Blocks Timeline - Grouped by Period */}
          <div className="overflow-y-auto max-h-[400px]">
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
                            Día {period.offsetDays}
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
                            {periodProgress.completed}/{periodProgress.total} bloques
                          </span>
                        </div>
                      </div>
                      
                      {/* Period Status Badge */}
                      {periodStatus === 'completed' && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                          ✓ Completado
                        </span>
                      )}
                      {periodStatus === 'in_progress' && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          En curso
                        </span>
                      )}
                    </div>
                    
                    {/* Period Blocks */}
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-4">
                      {periodBlocks.map((block, blockIndex) => {
                        const blockProgress = getBlockProgress(block.id);
                        const status = blockProgress?.status || 'pending';
                        const blockTasks = tasks.filter(t => t.blockId === block.id).sort((a, b) => a.order - b.order);
                        const isExpanded = expandedBlocks.has(block.id);
                        
                        return (
                          <div key={block.id} className="relative pl-4">
                            {/* Block connector dot */}
                            <div className={cn(
                              "absolute -left-[5px] top-5 w-2 h-2 rounded-full border-2 border-white",
                              status === 'completed' ? 'bg-emerald-500' :
                              status === 'in_progress' ? 'bg-blue-500' :
                              'bg-gray-300'
                            )} />
                            
                            {/* Block Card */}
                            <div 
                              className={cn(
                                "border rounded-xl p-3 cursor-pointer transition-all hover:shadow-md",
                                getBlockStatusBg(status),
                                isExpanded && "shadow-md"
                              )}
                              onClick={() => toggleBlockExpanded(block.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getBlockStatusIcon(status)}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-medium text-gray-900 text-sm">{block.name}</h5>
                                    <div className="flex items-center gap-2">
                                      {blockProgress?.daysSpent !== undefined && blockProgress.daysSpent > 0 && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {blockProgress.daysSpent}d
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
                                        <span>Inicio: {formatDate(blockProgress.startedAt)}</span>
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
                                    Tareas ({blockTasks.length})
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
                                  No hay tareas en este bloque
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
                  <span className="text-sm text-gray-400">Fin del Journey</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
