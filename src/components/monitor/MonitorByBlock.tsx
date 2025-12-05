import { useState, useMemo } from 'react';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Timer,
  ChevronDown,
  ChevronUp,
  Play,
  Circle,
  ExternalLink,
  CheckSquare,
  Square,
  Zap,
  RotateCcw,
  Mail,
  Flag,
  Filter,
  X,
  LayoutGrid,
  GitBranch,
  ArrowRightLeft,
  ArrowUpDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Block } from '@/types/journey';

interface MonitorByBlockProps {
  journeyId: string;
}

type StatusFilter = 'all' | 'at_risk' | 'delayed' | 'on_track';
type ViewMode = 'timeline' | 'tree';
type LayoutMode = 'horizontal' | 'vertical';

export function MonitorByBlock({ journeyId }: MonitorByBlockProps) {
  const { 
    getBlocksByJourneyId, 
    getJourneyById, 
    employees, 
    employeeProgress,
  } = useJourneyStore();
  
  const journey = getJourneyById(journeyId);
  const blocks = getBlocksByJourneyId(journeyId);
  
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [layout, setLayout] = useState<LayoutMode>('horizontal');
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Group blocks by period
  const blocksByPeriod = useMemo(() => {
    if (!journey) return [];
    
    const sortedPeriods = [...journey.periods].sort((a, b) => a.order - b.order);
    
    return sortedPeriods.map(period => {
      const periodBlocks = blocks
        .filter(b => b.periodId === period.id)
        .sort((a, b) => a.order - b.order);
      return {
        period,
        blocks: periodBlocks
      };
    }).filter(group => group.blocks.length > 0);
  }, [journey, blocks]);

  // Get employees in a block with their progress
  const getEmployeesInBlockWithProgress = (blockId: string) => {
    const progressList = employeeProgress.filter(p => 
      p.journeyId === journeyId && p.currentBlockId === blockId
    );
    
    return progressList.map(progress => {
      const employee = employees.find(e => e.id === progress.employeeId);
      const blockProgress = progress.blockProgress.find(bp => bp.blockId === blockId);
      return {
        employee,
        progress,
        blockProgress,
        daysInBlock: blockProgress?.daysSpent || 0
      };
    }).filter(item => item.employee);
  };

  // Filter employees based on status
  const filterEmployees = (employeeList: ReturnType<typeof getEmployeesInBlockWithProgress>) => {
    if (statusFilter === 'all') return employeeList;
    return employeeList.filter(item => item.progress.status === statusFilter);
  };

  // Calculate block stats
  const getBlockStats = (blockId: string) => {
    const employeesInBlock = getEmployeesInBlockWithProgress(blockId);
    const atRisk = employeesInBlock.filter(e => e.progress.status === 'at_risk').length;
    const delayed = employeesInBlock.filter(e => e.progress.status === 'delayed').length;
    const onTrack = employeesInBlock.filter(e => e.progress.status === 'on_track').length;
    
    return {
      total: employeesInBlock.length,
      atRisk,
      delayed,
      onTrack
    };
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

  const toggleEmployeeSelection = (progressId: string) => {
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(progressId)) {
        next.delete(progressId);
      } else {
        next.add(progressId);
      }
      return next;
    });
  };

  const selectAllInBlock = (blockId: string) => {
    const employeesInBlock = getEmployeesInBlockWithProgress(blockId);
    const filtered = filterEmployees(employeesInBlock);
    const allIds = filtered.map(e => e.progress.id);
    
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      return next;
    });
  };

  const deselectAllInBlock = (blockId: string) => {
    const employeesInBlock = getEmployeesInBlockWithProgress(blockId);
    const allIds = employeesInBlock.map(e => e.progress.id);
    
    setSelectedEmployees(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.delete(id));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedEmployees(new Set());
  };

  const expandAll = () => {
    const allBlockIds = blocks.map(b => b.id);
    setExpandedBlocks(new Set(allBlockIds));
  };

  const collapseAll = () => {
    setExpandedBlocks(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'at_risk': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'delayed': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_track': return 'On track';
      case 'at_risk': return 'At risk';
      case 'delayed': return 'Delayed';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  if (!journey) return null;

  const totalSelected = selectedEmployees.size;

  // Render employee avatar with status
  const renderEmployeeAvatar = (
    employee: { name: string }, 
    status: string, 
    progressId: string,
    daysInBlock: number,
    size: 'sm' | 'md' = 'md'
  ) => {
    const isSelected = selectedEmployees.has(progressId);
    const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
    
    return (
      <div 
        key={progressId}
        className="relative group"
        title={`${employee.name} - ${getStatusLabel(status)} - ${daysInBlock}d in block`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleEmployeeSelection(progressId);
          }}
          className={cn(
            "rounded-full flex items-center justify-center font-semibold transition-all border-2",
            sizeClasses,
            status === 'delayed' 
              ? "bg-red-100 text-red-700 border-red-300" 
              : status === 'at_risk'
              ? "bg-amber-100 text-amber-700 border-amber-300"
              : "bg-gray-100 text-gray-600 border-gray-200",
            isSelected && "ring-2 ring-indigo-500 ring-offset-1"
          )}
        >
          {employee.name.charAt(0)}
        </button>
        {/* Status indicator dot */}
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white",
          status === 'delayed' ? 'bg-red-500' :
          status === 'at_risk' ? 'bg-amber-500' :
          'bg-emerald-500'
        )} />
      </div>
    );
  };

  // Timeline View - Horizontal
  const renderTimelineHorizontal = () => (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-4 p-4 min-w-max">
        {blocksByPeriod.map(({ period, blocks: periodBlocks }) => {
          // Calculate period stats
          const periodStats = periodBlocks.reduce((acc, block) => {
            const stats = getBlockStats(block.id);
            return {
              total: acc.total + stats.total,
              atRisk: acc.atRisk + stats.atRisk,
              delayed: acc.delayed + stats.delayed
            };
          }, { total: 0, atRisk: 0, delayed: 0 });

          return (
          <div key={period.id} className="flex-shrink-0 w-72">
            {/* Period Header */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl p-3 mb-3 border border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-slate-800">{period.label}</h4>
                  <span className="text-xs text-slate-500">Day {period.offsetDays}</span>
                </div>
              </div>
              {/* Period Stats */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {periodStats.total} employees
                </span>
                {periodStats.delayed > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                    {periodStats.delayed} ⚠️
                  </span>
                )}
                {periodStats.atRisk > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                    {periodStats.atRisk} ⚡
                  </span>
                )}
              </div>
            </div>
            
            {/* Blocks in this period */}
            <div className="space-y-3">
              {periodBlocks.map((block) => {
                const stats = getBlockStats(block.id);
                const employeesInBlock = filterEmployees(getEmployeesInBlockWithProgress(block.id));
                const isExpanded = expandedBlocks.has(block.id);
                
                return (
                  <div 
                    key={block.id}
                    className={cn(
                      "bg-white rounded-xl border transition-all",
                      stats.delayed > 0 
                        ? "border-red-200 shadow-red-100" 
                        : stats.atRisk > 0
                        ? "border-amber-200 shadow-amber-100"
                        : "border-gray-200",
                      isExpanded && "shadow-lg"
                    )}
                  >
                    {/* Block Header */}
                    <div 
                      className="p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                      onClick={() => toggleBlockExpanded(block.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 text-sm truncate">{block.name}</h5>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Quick stats */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{stats.total} employees</span>
                        {stats.delayed > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                            {stats.delayed} ⚠️
                          </span>
                        )}
                        {stats.atRisk > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            {stats.atRisk} ⚡
                          </span>
                        )}
                      </div>
                      
                      {/* Employee avatars preview */}
                      {!isExpanded && employeesInBlock.length > 0 && (
                        <div className="flex items-center gap-1 mt-3 flex-wrap">
                          {employeesInBlock.slice(0, 6).map(({ employee, progress, daysInBlock }) => (
                            employee && renderEmployeeAvatar(employee, progress.status, progress.id, daysInBlock, 'sm')
                          ))}
                          {employeesInBlock.length > 6 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-medium">
                              +{employeesInBlock.length - 6}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Expanded employee list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-3">
                        {/* Select all */}
                        {employeesInBlock.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const allSelected = employeesInBlock.every(e => selectedEmployees.has(e.progress.id));
                              allSelected ? deselectAllInBlock(block.id) : selectAllInBlock(block.id);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
                          >
                            <CheckSquare className="w-3 h-3" />
                            Select all
                          </button>
                        )}
                        
                        <div className="space-y-2">
                          {employeesInBlock.map(({ employee, progress, daysInBlock }) => {
                            if (!employee) return null;
                            const isSelected = selectedEmployees.has(progress.id);
                            
                            return (
                              <div 
                                key={progress.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg transition-colors",
                                  isSelected ? "bg-indigo-50" : "hover:bg-gray-50"
                                )}
                              >
                                <button
                                  onClick={() => toggleEmployeeSelection(progress.id)}
                                  className="flex-shrink-0"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Square className="w-4 h-4 text-gray-300" />
                                  )}
                                </button>
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                                  progress.status === 'delayed' 
                                    ? "bg-red-100 text-red-700" 
                                    : progress.status === 'at_risk'
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-600"
                                )}>
                                  {employee.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{employee.name}</p>
                                  <p className="text-xs text-gray-500">{daysInBlock}d in block</p>
                                </div>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium border",
                                  getStatusColor(progress.status)
                                )}>
                                  {getStatusLabel(progress.status)}
                                </span>
                              </div>
                            );
                          })}
                          
                          {employeesInBlock.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-4">
                              No employees {statusFilter !== 'all' && getStatusLabel(statusFilter).toLowerCase()}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );})}
      </div>
    </div>
  );

  // Timeline View - Vertical (original view)
  const renderTimelineVertical = () => (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {blocksByPeriod.map(({ period, blocks: periodBlocks }, periodIndex) => {
          const periodStats = periodBlocks.reduce((acc, block) => {
            const stats = getBlockStats(block.id);
            return {
              total: acc.total + stats.total,
              atRisk: acc.atRisk + stats.atRisk,
              delayed: acc.delayed + stats.delayed
            };
          }, { total: 0, atRisk: 0, delayed: 0 });

          return (
            <div key={period.id} className="relative">
              {/* Period connector line */}
              {periodIndex < blocksByPeriod.length - 1 && (
                <div className="absolute left-4 top-[60px] w-0.5 bottom-[-24px] bg-gray-200" />
              )}
              
              {/* Period Header */}
              <div className="relative flex items-center gap-3 p-3 rounded-xl mb-3 transition-all bg-gradient-to-r from-slate-50 to-slate-100/50 border border-slate-200">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                  <Timer className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-gray-800">{period.label}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 text-gray-600 border">
                      Day {period.offsetDays}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {periodStats.total} employees
                    </span>
                    {periodStats.delayed > 0 && (
                      <span className="text-red-600 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {periodStats.delayed} delayed
                      </span>
                    )}
                    {periodStats.atRisk > 0 && (
                      <span className="text-amber-600 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        {periodStats.atRisk} at risk
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Period Blocks */}
              <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-4">
                {periodBlocks.map((block) => {
                  const stats = getBlockStats(block.id);
                  const isExpanded = expandedBlocks.has(block.id);
                  const employeesInBlock = filterEmployees(getEmployeesInBlockWithProgress(block.id));
                  const allSelected = employeesInBlock.length > 0 && 
                    employeesInBlock.every(e => selectedEmployees.has(e.progress.id));
                  
                  return (
                    <div key={block.id} className="relative pl-4">
                      <div className={cn(
                        "absolute -left-[5px] top-5 w-2 h-2 rounded-full border-2 border-white",
                        stats.delayed > 0 ? 'bg-red-500' :
                        stats.atRisk > 0 ? 'bg-amber-500' :
                        stats.total > 0 ? 'bg-emerald-500' :
                        'bg-gray-300'
                      )} />
                      
                      <div className={cn(
                        "border rounded-xl transition-all",
                        stats.delayed > 0 
                          ? "border-red-200 bg-white" 
                          : stats.atRisk > 0
                          ? "border-amber-200 bg-white"
                          : "border-gray-200 bg-white",
                        isExpanded && "shadow-md"
                      )}>
                        <div 
                          className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                          onClick={() => toggleBlockExpanded(block.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium text-gray-900 text-sm">{block.name}</h5>
                              {stats.total > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                  {stats.total} employees
                                </span>
                              )}
                            </div>
                            
                            {(stats.delayed > 0 || stats.atRisk > 0) && (
                              <div className="flex items-center gap-2 mt-1">
                                {stats.delayed > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                    {stats.delayed} delayed
                                  </span>
                                )}
                                {stats.atRisk > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                    {stats.atRisk} at risk
                                  </span>
                                )}
                              </div>
                            )}
                            
                            {/* Employee avatars preview */}
                            {!isExpanded && employeesInBlock.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                {employeesInBlock.slice(0, 8).map(({ employee, progress, daysInBlock }) => (
                                  employee && renderEmployeeAvatar(employee, progress.status, progress.id, daysInBlock, 'sm')
                                ))}
                                {employeesInBlock.length > 8 && (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-medium">
                                    +{employeesInBlock.length - 8}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100">
                            {employeesInBlock.length > 0 && (
                              <div className="px-3 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    allSelected ? deselectAllInBlock(block.id) : selectAllInBlock(block.id);
                                  }}
                                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900"
                                >
                                  {allSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                  {allSelected ? 'Deselect all' : 'Select all'}
                                </button>
                                <span className="text-xs text-gray-400">
                                  {employeesInBlock.filter(e => selectedEmployees.has(e.progress.id)).length} selected
                                </span>
                              </div>
                            )}
                            
                            <div className="divide-y divide-gray-50">
                              {employeesInBlock.map(({ employee, progress, daysInBlock }) => {
                                if (!employee) return null;
                                const isSelected = selectedEmployees.has(progress.id);
                                
                                return (
                                  <div 
                                    key={progress.id}
                                    className={cn(
                                      "px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors",
                                      isSelected && "bg-indigo-50/30"
                                    )}
                                  >
                                    <button
                                      onClick={() => toggleEmployeeSelection(progress.id)}
                                      className="flex-shrink-0"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                                      ) : (
                                        <Square className="w-4 h-4 text-gray-300 hover:text-gray-400" />
                                      )}
                                    </button>
                                    
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                                      progress.status === 'delayed' 
                                        ? "bg-red-100 text-red-700" 
                                        : progress.status === 'at_risk'
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-600"
                                    )}>
                                      {employee.name.charAt(0)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 truncate">
                                          {employee.name}
                                        </span>
                                        <span className={cn(
                                          "px-2 py-0.5 rounded-full text-xs font-medium border",
                                          getStatusColor(progress.status)
                                        )}>
                                          {getStatusLabel(progress.status)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{employee.department}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {daysInBlock} days in this block
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <button 
                                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      title="Ver detalle"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              })}
                              
                              {employeesInBlock.length === 0 && (
                                <div className="px-3 py-6 text-center text-sm text-gray-400">
                                  {statusFilter !== 'all' 
                                    ? `No employees ${getStatusLabel(statusFilter).toLowerCase()} in this block`
                                    : 'No employees in this block'
                                  }
                                </div>
                              )}
                            </div>
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
        
        {blocksByPeriod.length > 0 && (
          <div className="flex items-center gap-3 pl-4">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Flag className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-sm text-gray-400">Journey End</span>
          </div>
        )}

        {blocksByPeriod.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No blocks in this journey</p>
          </div>
        )}
      </div>
    </div>
  );

  // Tree View - Shows dependencies and flow
  const renderTreeView = () => (
    <div className="flex-1 overflow-auto p-4">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Start node */}
        <div className="flex justify-center">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl font-medium shadow-lg">
            🚀 Journey Start
          </div>
        </div>
        
        {/* Tree content */}
        {blocksByPeriod.map(({ period, blocks: periodBlocks }, periodIndex) => {
          const periodStats = periodBlocks.reduce((acc, block) => {
            const stats = getBlockStats(block.id);
            return {
              total: acc.total + stats.total,
              atRisk: acc.atRisk + stats.atRisk,
              delayed: acc.delayed + stats.delayed
            };
          }, { total: 0, atRisk: 0, delayed: 0 });

          return (
            <div key={period.id} className="relative">
              {/* Connector from previous */}
              <div className="flex justify-center mb-4">
                <div className="w-0.5 h-8 bg-gray-300" />
              </div>
              
              {/* Wait node (period) */}
              <div className="flex justify-center mb-4">
                <div className="px-4 py-2 rounded-lg border-2 border-dashed flex items-center gap-2 border-slate-300 bg-slate-50">
                  <Timer className="w-4 h-4 text-slate-500" />
                  <span className="font-medium text-slate-700">{period.label}</span>
                  <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded-full border">
                    Day {period.offsetDays}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({periodStats.total} employees)
                  </span>
                </div>
              </div>
              
              {/* Connector to blocks */}
              <div className="flex justify-center mb-4">
                <div className="w-0.5 h-4 bg-gray-300" />
              </div>
              
              {/* Blocks in parallel */}
              <div className={cn(
                "flex justify-center gap-4 flex-wrap",
                periodBlocks.length > 3 && "max-w-3xl mx-auto"
              )}>
                {periodBlocks.map((block) => {
                  const stats = getBlockStats(block.id);
                  const employeesInBlock = filterEmployees(getEmployeesInBlockWithProgress(block.id));
                  const isExpanded = expandedBlocks.has(block.id);
                  
                  return (
                    <div 
                      key={block.id}
                      className={cn(
                        "bg-white rounded-xl border-2 transition-all min-w-[200px] max-w-[280px]",
                        stats.delayed > 0 
                          ? "border-red-300 shadow-red-100" 
                          : stats.atRisk > 0
                          ? "border-amber-300 shadow-amber-100"
                          : "border-gray-200",
                        isExpanded && "shadow-xl"
                      )}
                    >
                      <div 
                        className="p-3 cursor-pointer"
                        onClick={() => toggleBlockExpanded(block.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 text-sm">{block.name}</h5>
                          <div className="flex items-center gap-1">
                            {stats.delayed > 0 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                            {stats.atRisk > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Users className="w-3 h-3" />
                          {stats.total} employees
                        </div>
                        
                        {/* Employee avatars */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {employeesInBlock.slice(0, 5).map(({ employee, progress, daysInBlock }) => (
                            employee && renderEmployeeAvatar(employee, progress.status, progress.id, daysInBlock, 'sm')
                          ))}
                          {employeesInBlock.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-medium">
                              +{employeesInBlock.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isExpanded && employeesInBlock.length > 0 && (
                        <div className="border-t border-gray-100 p-2 space-y-1 max-h-48 overflow-y-auto">
                          {employeesInBlock.map(({ employee, progress, daysInBlock }) => {
                            if (!employee) return null;
                            return (
                              <div 
                                key={progress.id}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50"
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEmployeeSelection(progress.id);
                                  }}
                                >
                                  {selectedEmployees.has(progress.id) ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-gray-300" />
                                  )}
                                </button>
                                <span className="text-xs font-medium truncate flex-1">{employee.name}</span>
                                <span className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  progress.status === 'delayed' ? 'bg-red-500' :
                                  progress.status === 'at_risk' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                )} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        
        {/* End connector and node */}
        <div className="flex justify-center mt-4">
          <div className="w-0.5 h-8 bg-gray-300" />
        </div>
        <div className="flex justify-center">
          <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-xl font-medium flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Journey End
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between pb-4 flex-shrink-0 border-b border-gray-200 mb-4">
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex items-center gap-1 border-b border-transparent">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                viewMode === 'timeline' 
                  ? "text-gray-900" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Timeline
              {viewMode === 'timeline' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                viewMode === 'tree' 
                  ? "text-gray-900" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <GitBranch className="w-4 h-4" />
              Tree
              {viewMode === 'tree' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" />
              )}
            </button>
          </div>
          
          {/* Layout toggle (only for timeline) */}
          {viewMode === 'timeline' && (
            <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-gray-200 shadow-sm ml-2">
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
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200" />
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
              {[
                { id: 'all' as const, label: 'All', color: 'text-gray-600' },
                { id: 'delayed' as const, label: 'Delayed', color: 'text-red-600' },
                { id: 'at_risk' as const, label: 'At risk', color: 'text-amber-600' },
                { id: 'on_track' as const, label: 'On track', color: 'text-emerald-600' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    statusFilter === filter.id 
                      ? "bg-gray-900 text-white" 
                      : `${filter.color} hover:bg-gray-100`
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Expand
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Collapse
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {totalSelected > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-200 rounded-xl flex items-center justify-between animate-in slide-in-from-top duration-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-700">{totalSelected} employees selected</span>
            </div>
            <button
              onClick={clearSelection}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
              <RotateCcw className="w-4 h-4" />
              Reset block
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
              <Zap className="w-4 h-4" />
              Complete tasks
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
              <Mail className="w-4 h-4" />
              Send reminder
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm">
              <Flag className="w-4 h-4" />
              Unblock
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'timeline' && layout === 'horizontal' && renderTimelineHorizontal()}
      {viewMode === 'timeline' && layout === 'vertical' && renderTimelineVertical()}
      {viewMode === 'tree' && renderTreeView()}
    </div>
  );
}
