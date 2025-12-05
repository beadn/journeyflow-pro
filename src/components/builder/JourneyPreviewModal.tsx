import { useState, useMemo } from 'react';
import { Journey, Block, Task, BlockRule, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Eye, 
  User, 
  MapPin, 
  Building2, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Users, 
  GitBranch, 
  Sparkles, 
  Timer,
  ChevronDown,
  ChevronUp,
  Circle,
  Flag,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { blockTemplates } from '@/lib/blockTemplates';

interface JourneyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Journey;
}

interface EmployeeConditions {
  department: string;
  location: string;
  role: string;
  employeeType: string;
  legalEntity: string;
  manager: string;
}

interface PreviewTask extends Partial<Task> {
  isConditional?: boolean;
  ruleLabel?: string;
}

interface PreviewBlock {
  block: Block | { id: string; name: string; category?: string; isSubBlock: true; parentBlockName: string; periodId?: string };
  period: Period | undefined;
  baseTasks: Task[] | { title: string; type: string }[];
  conditionalTasks: PreviewTask[];
  skippedBlock: { skip: boolean; reason: string };
  totalTasks: number;
  dependencies: string[];
  isSubBlock?: boolean;
  parentBlockName?: string;
}

export function JourneyPreviewModal({ isOpen, onClose, journey }: JourneyPreviewModalProps) {
  const { getBlocksByJourneyId, getTasksByBlockId } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);

  const [conditions, setConditions] = useState<EmployeeConditions>({
    department: '',
    location: '',
    role: '',
    employeeType: '',
    legalEntity: '',
    manager: '',
  });

  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

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

  const evaluateCondition = (rule: BlockRule, conds: EmployeeConditions): boolean => {
    const attr = rule.condition.attribute;
    const value = rule.condition.value;
    const operator = rule.condition.operator;
    
    const condValue = conds[attr as keyof EmployeeConditions] || '';
    
    if (!condValue || !value) return false;

    switch (operator) {
      case 'equals':
        return condValue.toLowerCase() === String(value).toLowerCase();
      case 'not_equals':
        return condValue.toLowerCase() !== String(value).toLowerCase();
      case 'in':
        return Array.isArray(value) && value.some(v => v.toLowerCase() === condValue.toLowerCase());
      case 'not_in':
        return Array.isArray(value) && !value.some(v => v.toLowerCase() === condValue.toLowerCase());
      default:
        return false;
    }
  };

  // Topological sort to respect dependencies
  const sortBlocksByDependencies = (blocksToSort: Block[]): Block[] => {
    const sorted: Block[] = [];
    const visited = new Set<string>();
    const blockMap = new Map(blocksToSort.map(b => [b.id, b]));
    
    const visit = (block: Block) => {
      if (visited.has(block.id)) return;
      visited.add(block.id);
      
      // Visit dependencies first
      block.dependencyBlockIds.forEach(depId => {
        const dep = blockMap.get(depId);
        if (dep) visit(dep);
      });
      
      sorted.push(block);
    };
    
    // Sort by period first, then apply topological sort
    const byPeriod = [...blocksToSort].sort((a, b) => {
      const periodA = journey.periods.find(p => p.id === a.periodId);
      const periodB = journey.periods.find(p => p.id === b.periodId);
      return (periodA?.offsetDays || 0) - (periodB?.offsetDays || 0);
    });
    
    byPeriod.forEach(block => visit(block));
    
    return sorted;
  };

  // Calculate which tasks would execute based on conditions
  const previewData = useMemo(() => {
    const sortedBlocks = sortBlocksByDependencies(blocks);
    const result: PreviewBlock[] = [];
    
    sortedBlocks.forEach(block => {
      const baseTasks = getTasksByBlockId(block.id);
      const conditionalTasks: PreviewTask[] = [];
      const skippedBlock = { skip: false, reason: '' };
      const subBlocksToAdd: { template: typeof blockTemplates[0]; ruleLabel: string; parentPeriodId: string }[] = [];

      // Evaluate each rule
      block.rules.forEach(rule => {
        const conditionMet = evaluateCondition(rule, conditions);
        
        if (conditionMet) {
          if (rule.action.type === 'add_task') {
            const tasksToAdd = rule.action.addedTasks || (rule.action.addedTask ? [rule.action.addedTask] : []);
            tasksToAdd.forEach(task => {
              conditionalTasks.push({
                ...task,
                isConditional: true,
                ruleLabel: rule.label,
              });
            });
          } else if (rule.action.type === 'add_block' && rule.action.addedBlockTemplateId) {
            const template = blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId);
            if (template) {
              subBlocksToAdd.push({ template, ruleLabel: rule.label, parentPeriodId: block.periodId });
            }
          }
        }
      });

      // Get dependency names for display
      const dependencyNames = block.dependencyBlockIds
        .map(depId => blocks.find(b => b.id === depId)?.name || depId)
        .filter(Boolean);

      result.push({
        block,
        period: journey.periods.find(p => p.id === block.periodId),
        baseTasks,
        conditionalTasks,
        skippedBlock,
        totalTasks: skippedBlock.skip ? 0 : baseTasks.length + conditionalTasks.length,
        dependencies: dependencyNames,
      });

      // Add sub-blocks that were triggered by rules
      subBlocksToAdd.forEach(({ template, ruleLabel, parentPeriodId }) => {
        const subBlockTasks: PreviewTask[] = [];
        
        // Check if the sub-block template has rules that match
        template.rules?.forEach(subRule => {
          const subConditionMet = evaluateCondition(subRule as BlockRule, conditions);
          if (subConditionMet && subRule.action.type === 'add_task') {
            const tasksToAdd = subRule.action.addedTasks || (subRule.action.addedTask ? [subRule.action.addedTask] : []);
            tasksToAdd.forEach(task => {
              subBlockTasks.push({
                ...task,
                isConditional: true,
                ruleLabel: subRule.label,
              });
            });
          }
        });

        result.push({
          block: {
            id: `sub-${template.id}-${block.id}`,
            name: template.name,
            category: template.category,
            isSubBlock: true,
            parentBlockName: block.name,
            periodId: parentPeriodId,
          },
          period: journey.periods.find(p => p.id === parentPeriodId),
          baseTasks: template.suggestedTasks || [],
          conditionalTasks: subBlockTasks,
          skippedBlock: { skip: false, reason: '' },
          totalTasks: (template.suggestedTasks?.length || 0) + subBlockTasks.length,
          dependencies: [block.name],
          isSubBlock: true,
          parentBlockName: block.name,
        });
      });
    });
    
    return result;
  }, [blocks, conditions, journey.periods, getTasksByBlockId]);

  // Group preview data by period
  const previewByPeriod = useMemo(() => {
    const sortedPeriods = [...journey.periods].sort((a, b) => a.order - b.order);
    
    return sortedPeriods.map(period => {
      const periodBlocks = previewData.filter(p => p.period?.id === period.id);
      return {
        period,
        blocks: periodBlocks
      };
    }).filter(group => group.blocks.length > 0);
  }, [journey.periods, previewData]);

  // Calculate period stats
  const getPeriodStats = (periodBlocks: PreviewBlock[]) => {
    const activeBlocks = periodBlocks.filter(p => !p.skippedBlock.skip);
    const subBlocks = periodBlocks.filter(p => p.isSubBlock);
    const totalTasks = periodBlocks.reduce((sum, p) => sum + p.totalTasks, 0);
    
    return {
      totalBlocks: activeBlocks.length,
      subBlocks: subBlocks.length,
      totalTasks
    };
  };

  const totalTaskCount = previewData.reduce((sum, p) => sum + p.totalTasks, 0);
  const activeBlocks = previewData.filter(p => !p.skippedBlock.skip).length;
  const subBlockCount = previewData.filter(p => p.isSubBlock).length;

  const expandAll = () => {
    const allBlockIds = previewData.map(p => p.block.id);
    setExpandedBlocks(new Set(allBlockIds));
  };

  const collapseAll = () => {
    setExpandedBlocks(new Set());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Journey Preview</DialogTitle>
                <p className="text-sm text-muted-foreground">Simulate tasks based on employee conditions</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Conditions Panel */}
          <div className="w-80 border-r border-border p-4 space-y-4 bg-muted/30 overflow-y-auto">
            <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Employee Conditions
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Departamento
                </label>
                <select
                  value={conditions.department}
                  onChange={(e) => setConditions({ ...conditions, department: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Legal">Legal</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Location
                </label>
                <select
                  value={conditions.location}
                  onChange={(e) => setConditions({ ...conditions, location: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Madrid">Madrid</option>
                  <option value="Barcelona">Barcelona</option>
                  <option value="New York">New York</option>
                  <option value="London">London</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Employee Type
                </label>
                <select
                  value={conditions.employeeType}
                  onChange={(e) => setConditions({ ...conditions, employeeType: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Rol
                </label>
                <input
                  type="text"
                  value={conditions.role}
                  onChange={(e) => setConditions({ ...conditions, role: e.target.value })}
                  placeholder="Ej: Software Engineer"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Entidad Legal
                </label>
                <select
                  value={conditions.legalEntity}
                  onChange={(e) => setConditions({ ...conditions, legalEntity: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Spain S.L.">Spain S.L.</option>
                  <option value="USA Inc.">USA Inc.</option>
                  <option value="UK Ltd.">UK Ltd.</option>
                  <option value="Germany GmbH">Germany GmbH</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <Users className="w-3 h-3 inline mr-1" />
                  Manager
                </label>
                <input
                  type="text"
                  value={conditions.manager}
                  onChange={(e) => setConditions({ ...conditions, manager: e.target.value })}
                  placeholder="Manager name"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-border">
              <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200">
                <h4 className="text-xs font-semibold text-indigo-700 mb-2">Resumen</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">{activeBlocks}</span> active blocks</p>
                  {subBlockCount > 0 && (
                    <p className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span className="font-medium text-purple-600">{subBlockCount}</span> conditional sub-blocks
                    </p>
                  )}
                  <p><span className="font-medium text-foreground">{totalTaskCount}</span> total tasks</p>
                  <p><span className="font-medium text-foreground">{journey.periods.length}</span> time periods</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Results - Grouped by Period */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Expand/Collapse Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20 flex-shrink-0">
              <span className="text-sm font-medium text-gray-700">
                Journey Timeline
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  Collapse all
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
              {previewByPeriod.map(({ period, blocks: periodBlocks }, periodIndex) => {
                const stats = getPeriodStats(periodBlocks);
                
                return (
                  <div key={period.id} className="relative">
                    {/* Period connector line */}
                    {periodIndex < previewByPeriod.length - 1 && (
                      <div className="absolute left-4 top-[60px] w-0.5 bottom-[-24px] bg-gray-200" />
                    )}
                    
                    {/* Period Header */}
                    <div className="relative flex items-center gap-3 p-3 rounded-xl mb-3 bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                      {/* Period Icon */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                        <Timer className="w-4 h-4" />
                      </div>
                      
                      {/* Period Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-gray-800">
                            {period.label}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            Day {period.offsetDays}
                          </span>
                        </div>
                        
                        {/* Period Stats */}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{stats.totalBlocks} blocks</span>
                          {stats.subBlocks > 0 && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <Sparkles className="w-3 h-3" />
                              {stats.subBlocks} sub-blocks
                            </span>
                          )}
                          <span>{stats.totalTasks} tasks</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Period Blocks */}
                    <div className="space-y-2 pl-4 border-l-2 border-gray-100 ml-4">
                      {periodBlocks.map((previewBlock) => {
                        const { block, baseTasks, conditionalTasks, skippedBlock, dependencies, isSubBlock, parentBlockName } = previewBlock;
                        const isExpanded = expandedBlocks.has(block.id);
                        const taskCount = baseTasks.length + conditionalTasks.length;
                        
                        return (
                          <div key={block.id} className="relative pl-4">
                            {/* Block connector dot */}
                            <div className={cn(
                              "absolute -left-[5px] top-5 w-2 h-2 rounded-full border-2 border-white",
                              skippedBlock.skip 
                                ? 'bg-gray-300' 
                                : isSubBlock 
                                  ? 'bg-purple-500' 
                                  : 'bg-slate-500'
                            )} />
                            
                            {/* Block Card */}
                            <div 
                              className={cn(
                                "border rounded-xl transition-all cursor-pointer hover:shadow-md",
                                skippedBlock.skip
                                  ? "border-dashed border-gray-300 bg-gray-50 opacity-60"
                                  : isSubBlock
                                    ? "border-purple-200 bg-purple-50/50"
                                    : "border-gray-200 bg-white",
                                isExpanded && "shadow-md"
                              )}
                              onClick={() => toggleBlockExpanded(block.id)}
                            >
                              {/* Block Header */}
                              <div className="p-3 flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {skippedBlock.skip ? (
                                    <Circle className="w-5 h-5 text-gray-300" />
                                  ) : (
                                    <CheckCircle2 className={cn(
                                      "w-5 h-5",
                                      isSubBlock ? "text-purple-500" : "text-red-500"
                                    )} />
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {isSubBlock && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                                            <Sparkles className="w-3 h-3" />
                                            Sub-block
                                          </span>
                                        )}
                                        <h5 className="font-medium text-gray-900 text-sm">{block.name}</h5>
                                      </div>
                                      
                                      {/* Dependencies & Parent info */}
                                      {(dependencies.length > 0 || parentBlockName) && (
                                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                          {isSubBlock && parentBlockName && (
                                            <span className="text-purple-600">← desde {parentBlockName}</span>
                                          )}
                                          {!isSubBlock && dependencies.length > 0 && (
                                            <span>↓ depende de: {dependencies.join(', ')}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {skippedBlock.skip ? (
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-600">
                                          Omitido
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-500">
                                          {taskCount} tasks
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
                                </div>
                              </div>

                              {/* Expanded: Tasks list */}
                              {isExpanded && !skippedBlock.skip && (
                                <div className="px-3 pb-3 pt-0">
                                  <div className="pt-3 border-t border-gray-200/50 space-y-1.5">
                                    {baseTasks.map((task, idx) => (
                                      <div 
                                        key={'id' in task ? task.id : idx} 
                                        className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/80 text-sm"
                                      >
                                        <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="flex-1 text-gray-700">{task.title}</span>
                                        {'assigneeType' in task && (
                                          <span className="text-xs text-gray-400 capitalize">{task.assigneeType}</span>
                                        )}
                                      </div>
                                    ))}
                                    
                                    {conditionalTasks.map((task, idx) => (
                                      <div 
                                        key={idx} 
                                        className="flex items-center gap-2 p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-sm"
                                      >
                                        <GitBranch className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                        <span className="flex-1 text-gray-700">{task.title}</span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700">
                                          Condicional
                                        </span>
                                      </div>
                                    ))}

                                    {baseTasks.length === 0 && conditionalTasks.length === 0 && (
                                      <p className="text-xs text-gray-400 text-center py-2">No tasks</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Skipped reason */}
                              {isExpanded && skippedBlock.skip && (
                                <div className="px-3 pb-3 pt-0">
                                  <div className="pt-3 border-t border-gray-200/50">
                                    <p className="text-xs text-gray-500 text-center">
                                      Omitido por: <span className="font-medium">{skippedBlock.reason}</span>
                                    </p>
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
              
              {/* Journey End Marker */}
              {previewByPeriod.length > 0 && (
                <div className="flex items-center gap-3 pl-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Flag className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">End of Journey</span>
                </div>
              )}

              {previewByPeriod.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No blocks in this journey</p>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
