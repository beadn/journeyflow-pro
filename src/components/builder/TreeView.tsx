import { useMemo, useState, useCallback } from "react";
import { Journey, Block, BlockRule } from "@/types/journey";
import { useJourneyStore } from "@/stores/journeyStore";
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Controls,
  Background,
  Handle,
  Position,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AddBlockModal } from "./AddBlockModal";
import { 
  Plus, 
  Play, 
  Timer, 
  GitBranch,
  CheckSquare,
  Scale,
  Monitor,
  Users,
  Smile,
  UsersRound,
  MessageSquare,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronRight,
  FileText,
  Diamond,
  Sparkles,
  X,
  Trash2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { blockTemplates } from "@/lib/blockTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TreeViewProps {
  journey: Journey;
  onBlockEdit: (blockId: string) => void;
}

// Category colors
const getCategoryConfig = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'legal':
      return { border: 'border-emerald-400', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', accent: '#10b981', icon: Scale };
    case 'it':
      return { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700 border-blue-200', accent: '#3b82f6', icon: Monitor };
    case 'hr':
      return { border: 'border-purple-400', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700 border-purple-200', accent: '#8b5cf6', icon: Users };
    case 'welcome':
    case 'onboarding':
      return { border: 'border-amber-400', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700 border-amber-200', accent: '#f59e0b', icon: Smile };
    case 'team':
    case 'social':
      return { border: 'border-cyan-400', bg: 'bg-cyan-50', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200', accent: '#06b6d4', icon: UsersRound };
    case 'feedback':
    case 'performance':
      return { border: 'border-pink-400', bg: 'bg-pink-50', badge: 'bg-pink-100 text-pink-700 border-pink-200', accent: '#ec4899', icon: MessageSquare };
    case 'training':
      return { border: 'border-violet-400', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700 border-violet-200', accent: '#7c3aed', icon: GraduationCap };
    default:
      return { border: 'border-gray-300', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-600 border-gray-200', accent: '#6b7280', icon: Layers };
  }
};

// Layout constants
const NODE_WIDTH = 280;
const NODE_HEIGHT_COLLAPSED = 90;
const NODE_HEIGHT_EXPANDED_BASE = 320; // Base height for expanded block
const NODE_HEIGHT_PER_RULE = 180; // Additional height per rule branch
const HORIZONTAL_GAP = 60;
const VERTICAL_GAP = 80;

// Calculate expanded block height based on rules
function calculateBlockHeight(block: Block, isExpanded: boolean, expandedSubBlocks: Set<string>): number {
  if (!isExpanded) return NODE_HEIGHT_COLLAPSED;
  
  const rulesCount = block.rules.length;
  if (rulesCount === 0) return NODE_HEIGHT_EXPANDED_BASE;
  
  // Check if any sub-block is expanded (adds more height)
  let maxSubBlockHeight = 0;
  block.rules.forEach(rule => {
    if (rule.action.type === 'add_block' && expandedSubBlocks.has(rule.id)) {
      const template = blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId);
      if (template) {
        const tasksCount = template.suggestedTasks?.length || 0;
        maxSubBlockHeight = Math.max(maxSubBlockHeight, 60 + tasksCount * 16);
      }
    }
  });
  
  return NODE_HEIGHT_EXPANDED_BASE + NODE_HEIGHT_PER_RULE + maxSubBlockHeight;
}

// Calculate expanded block width based on rules
function calculateBlockWidth(block: Block, isExpanded: boolean): number {
  if (!isExpanded) return NODE_WIDTH;
  return Math.max(340, block.rules.length * 150 + 60);
}

// Layout helpers

// Group blocks by period
function groupBlocksByPeriod(
  blocks: Block[], 
  periods: { id: string; label: string; offsetDays: number }[]
): Map<string, Block[]> {
  const groups = new Map<string, Block[]>();
  periods.forEach(p => groups.set(p.id, []));
  blocks.forEach(block => {
    const arr = groups.get(block.periodId);
    if (arr) arr.push(block);
  });
  return groups;
}

// Calculate dependency levels within a set of blocks
// Level 0 = no dependencies (or deps outside this set)
// Level N = depends on blocks at level N-1 or lower
function calculateDependencyLevels(blocks: Block[], allBlockIds: Set<string>): Map<string, number> {
  const levels = new Map<string, number>();
  const blockIds = new Set(blocks.map(b => b.id));
  
  function getLevel(block: Block, visited = new Set<string>()): number {
    if (visited.has(block.id)) return 0; // Circular dependency protection
    if (levels.has(block.id)) return levels.get(block.id)!;
    
    visited.add(block.id);
    
    // Get dependencies that are in allBlockIds (all blocks in journey)
    const deps = block.dependencyBlockIds.filter(d => allBlockIds.has(d));
    
    if (deps.length === 0) {
      levels.set(block.id, 0);
      return 0;
    }
    
    // Find the max level among dependencies
    let maxDepLevel = -1;
    deps.forEach(depId => {
      const depBlock = blocks.find(b => b.id === depId);
      if (depBlock) {
        maxDepLevel = Math.max(maxDepLevel, getLevel(depBlock, new Set(visited)));
      } else {
        // Dependency is in another period - treat as level -1 (we'll be at level 0)
        maxDepLevel = Math.max(maxDepLevel, -1);
      }
    });
    
    const level = maxDepLevel + 1;
    levels.set(block.id, level);
    return level;
  }
  
  blocks.forEach(block => getLevel(block));
  return levels;
}

// Group blocks by their dependency level
function groupByDependencyLevel(blocks: Block[], levels: Map<string, number>): Map<number, Block[]> {
  const groups = new Map<number, Block[]>();
  blocks.forEach(block => {
    const level = levels.get(block.id) || 0;
    if (!groups.has(level)) groups.set(level, []);
    groups.get(level)!.push(block);
  });
  return groups;
}

// Minimize dependencies (remove transitive)
function minimizeDependencies(blocks: Block[]): Map<string, string[]> {
  const blockMap = new Map(blocks.map(b => [b.id, b]));
  const result = new Map<string, string[]>();
  const ancestorCache = new Map<string, Set<string>>();
  
  function getAncestors(blockId: string): Set<string> {
    if (ancestorCache.has(blockId)) return ancestorCache.get(blockId)!;
    const block = blockMap.get(blockId);
    if (!block) { ancestorCache.set(blockId, new Set()); return new Set(); }
    const ancestors = new Set<string>();
    for (const depId of block.dependencyBlockIds) {
      if (blockMap.has(depId)) {
        ancestors.add(depId);
        getAncestors(depId).forEach(a => ancestors.add(a));
      }
    }
    ancestorCache.set(blockId, ancestors);
    return ancestors;
  }
  
  blocks.forEach(block => {
    const directDeps = block.dependencyBlockIds.filter(d => blockMap.has(d));
    const minimized = directDeps.filter(depId => !directDeps.some(otherDepId => otherDepId !== depId && getAncestors(otherDepId).has(depId)));
    result.set(block.id, minimized);
  });
  
  return result;
}

// Sort blocks horizontally to minimize edge crossings
// Blocks that share dependencies should be placed near each other
function sortBlocksToMinimizeCrossings(
  levelBlocks: Block[], 
  previousLevelBlockIds: string[],
  minimizedDeps: Map<string, string[]>
): Block[] {
  if (levelBlocks.length <= 1) return levelBlocks;
  if (previousLevelBlockIds.length === 0) return levelBlocks;
  
  // Create a position map for previous level blocks
  const prevPositions = new Map<string, number>();
  previousLevelBlockIds.forEach((id, idx) => prevPositions.set(id, idx));
  
  // Sort blocks by the average position of their dependencies in the previous level
  return [...levelBlocks].sort((a, b) => {
    const aDeps = (minimizedDeps.get(a.id) || []).filter(d => prevPositions.has(d));
    const bDeps = (minimizedDeps.get(b.id) || []).filter(d => prevPositions.has(d));
    
    // Calculate average position of dependencies
    const aAvg = aDeps.length > 0 
      ? aDeps.reduce((sum, d) => sum + (prevPositions.get(d) || 0), 0) / aDeps.length 
      : previousLevelBlockIds.length / 2;
    const bAvg = bDeps.length > 0 
      ? bDeps.reduce((sum, d) => sum + (prevPositions.get(d) || 0), 0) / bDeps.length 
      : previousLevelBlockIds.length / 2;
    
    return aAvg - bAvg;
  });
}


// ============== INLINE RULE EDITOR ==============

function InlineRuleEditor({ 
  rule, 
  onSave, 
  onCancel,
  onDelete,
}: { 
  rule?: BlockRule;
  onSave: (rule: BlockRule) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [attribute, setAttribute] = useState(rule?.condition.attribute || 'department');
  const [value, setValue] = useState(typeof rule?.condition.value === 'string' ? rule.condition.value : '');
  const [actionType, setActionType] = useState<'add_task' | 'add_block'>(rule?.action.type || 'add_task');
  const [taskTitle, setTaskTitle] = useState(rule?.action.addedTask?.title || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(rule?.action.addedBlockTemplateId || '');
  
  const handleSave = () => {
    const newRule: BlockRule = {
      id: rule?.id || `rule-${Date.now()}`,
      label: `${attribute} = ${value}`,
      condition: {
        attribute,
        operator: 'equals',
        value,
      },
      action: actionType === 'add_task' 
        ? { type: 'add_task', addedTask: { title: taskTitle, type: 'basic' } }
        : { type: 'add_block', addedBlockTemplateId: selectedTemplateId },
    };
    onSave(newRule);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-cyan-200 p-3 min-w-[280px] z-50" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700">{rule ? 'Edit rule' : 'New rule'}</span>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      
      {/* Condition */}
      <div className="space-y-2 mb-3">
        <div className="text-[10px] font-medium text-gray-500">SI</div>
        <div className="flex gap-2">
          <Select value={attribute} onValueChange={setAttribute}>
            <SelectTrigger className="h-7 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="department">Departamento</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="employeeType">Employee Type</SelectItem>
              <SelectItem value="role">Rol</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-gray-400 self-center">=</span>
          <Input 
            value={value} 
            onChange={e => setValue(e.target.value)}
            placeholder="Valor..."
            className="h-7 text-xs flex-1"
          />
        </div>
      </div>
      
      {/* Action */}
      <div className="space-y-2 mb-3">
        <div className="text-[10px] font-medium text-gray-500">ENTONCES</div>
        <Select value={actionType} onValueChange={(v: 'add_task' | 'add_block') => setActionType(v)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_task">Add tasks</SelectItem>
            <SelectItem value="add_block">Add block</SelectItem>
          </SelectContent>
        </Select>
        
        {actionType === 'add_task' ? (
          <Input 
            value={taskTitle} 
            onChange={e => setTaskTitle(e.target.value)}
            placeholder="Task title..."
            className="h-7 text-xs"
          />
        ) : (
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Select block..." />
            </SelectTrigger>
            <SelectContent>
              {blockTemplates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} className="flex-1 h-7 text-xs">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        {rule && onDelete && (
          <Button size="sm" variant="destructive" onClick={onDelete} className="h-7 text-xs">
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============== INLINE NEXT BLOCK EDITOR (from parent perspective) ==============

function InlineNextBlockEditor({ 
  currentBlockId,
  currentChildren,
  availableBlocks,
  periods,
  onSave, 
  onCancel,
}: { 
  currentBlockId: string;
  currentChildren: string[];
  availableBlocks: Block[];
  periods: { id: string; label: string; offsetDays: number }[];
  onSave: (blockId: string, dependencies: string[]) => void;
  onCancel: () => void;
}) {
  const [selectedChildren, setSelectedChildren] = useState<string[]>(currentChildren);
  
  // Get current block's period to filter only same or later periods
  const currentBlock = availableBlocks.find(b => b.id === currentBlockId);
  const currentPeriod = periods.find(p => p.id === currentBlock?.periodId);
  
  // Filter blocks that could come after (same or later periods, not self)
  const eligibleBlocks = availableBlocks.filter(b => {
    if (b.id === currentBlockId) return false;
    const blockPeriod = periods.find(p => p.id === b.periodId);
    if (!blockPeriod || !currentPeriod) return true;
    return blockPeriod.offsetDays >= currentPeriod.offsetDays;
  });
  
  const toggleChild = (blockId: string) => {
    setSelectedChildren(prev => 
      prev.includes(blockId) 
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId]
    );
  };
  
  const handleSave = () => {
    // For each selected child, add currentBlockId to their dependencies
    // For each unselected child that was previously selected, remove currentBlockId from their dependencies
    selectedChildren.forEach(childId => {
      const child = availableBlocks.find(b => b.id === childId);
      if (child && !child.dependencyBlockIds.includes(currentBlockId)) {
        onSave(childId, [...child.dependencyBlockIds, currentBlockId]);
      }
    });
    
    // Remove from children that were deselected
    currentChildren.forEach(childId => {
      if (!selectedChildren.includes(childId)) {
        const child = availableBlocks.find(b => b.id === childId);
        if (child) {
          onSave(childId, child.dependencyBlockIds.filter(id => id !== currentBlockId));
        }
      }
    });
    
    onCancel();
  };
  
  // Group blocks by period
  const blocksByPeriod = new Map<string, Block[]>();
  eligibleBlocks.forEach(block => {
    const list = blocksByPeriod.get(block.periodId) || [];
    list.push(block);
    blocksByPeriod.set(block.periodId, list);
  });
  
  // Sort periods by offsetDays
  const sortedPeriods = [...periods].sort((a, b) => a.offsetDays - b.offsetDays);
  
  return (
    <div className="bg-white rounded-lg shadow-lg border border-blue-200 p-3 min-w-[280px] max-h-[300px] overflow-y-auto z-50" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700">What comes next?</span>
        <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      
      <div className="text-[10px] text-gray-500 mb-2">
        Select blocks that come after this one:
      </div>
      
      {sortedPeriods.map(period => {
        const periodBlocks = blocksByPeriod.get(period.id) || [];
        if (periodBlocks.length === 0) return null;
        
        return (
          <div key={period.id} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Timer className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-medium text-gray-600">{period.label}</span>
              <span className="text-[9px] text-gray-400">
                {period.offsetDays === 0 ? 'Day 0' : `+${period.offsetDays}d`}
              </span>
            </div>
            <div className="space-y-1 pl-5">
              {periodBlocks.map(block => (
                <label 
                  key={block.id} 
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors",
                    selectedChildren.includes(block.id) ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedChildren.includes(block.id)}
                    onChange={() => toggleChild(block.id)}
                    className="w-3 h-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-gray-700">{block.name}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
      
      {eligibleBlocks.length === 0 && (
        <div className="text-[11px] text-gray-400 text-center py-4">
          No blocks available to connect
        </div>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <Button size="sm" onClick={handleSave} className="flex-1 h-7 text-xs">
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="h-7 text-xs">
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ============== INTERNAL TREE VIEW (HTML/CSS) ==============

function InternalTreeView({ 
  tasks, 
  rules, 
  accent,
  expandedSubBlocks,
  onToggleSubBlock,
  blockId,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}: { 
  tasks: { id: string; title: string }[];
  rules: BlockRule[];
  accent: string;
  expandedSubBlocks: Set<string>;
  onToggleSubBlock: (ruleId: string) => void;
  blockId: string;
  onAddRule: (blockId: string, rule: BlockRule) => void;
  onUpdateRule: (blockId: string, ruleId: string, rule: BlockRule) => void;
  onDeleteRule: (blockId: string, ruleId: string) => void;
}) {
  const hasRules = rules.length > 0;
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  const handleAddRule = (rule: BlockRule) => {
    onAddRule(blockId, rule);
    setShowAddRule(false);
  };
  
  const handleUpdateRule = (rule: BlockRule) => {
    if (editingRuleId) {
      onUpdateRule(blockId, editingRuleId, rule);
      setEditingRuleId(null);
    }
  };
  
  const handleDeleteRule = (ruleId: string) => {
    onDeleteRule(blockId, ruleId);
    setEditingRuleId(null);
  };
  
  return (
    <div className="flex flex-col items-center py-4">
      {/* Tasks Node */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 min-w-[200px] max-w-[240px]">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4" style={{ color: accent }} />
          <span className="text-xs font-semibold text-gray-900">{tasks.length} tasks</span>
        </div>
        <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
          {tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
              <span className="text-[11px] text-gray-600 truncate">{task.title}</span>
            </div>
          ))}
          {tasks.length > 4 && (
            <div className="text-[10px] text-gray-400 pl-3.5">+{tasks.length - 4} more...</div>
          )}
          {tasks.length === 0 && <div className="text-[11px] text-gray-400">No tasks</div>}
        </div>
      </div>
      
      {/* Connector line */}
      <div className="w-0.5 h-5 bg-cyan-400" />
      <div className="w-2 h-2 rounded-full bg-cyan-400" />
      <div className="w-0.5 h-5 bg-cyan-400" />
      
      {/* Condition Node */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 min-w-[180px] relative">
        <div className="absolute -top-2.5 left-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-medium">
            <Diamond className="w-3 h-3" />
            Condition
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-semibold text-gray-900">Audience Rules</div>
            <div className="text-[10px] text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''}</div>
          </div>
          <Users className="w-4 h-4 text-cyan-400" />
        </div>
      </div>
      
      {/* Dashed connector to add button */}
      <div className="w-0.5 h-3" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, #d1d5db 0, #d1d5db 3px, transparent 3px, transparent 6px)' }} />
      
      {/* Add rule button - now functional */}
      <div className="relative">
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAddRule(!showAddRule); }}
          className={cn(
            "w-6 h-6 rounded-full bg-white border-2 border-dashed flex items-center justify-center transition-all",
            showAddRule ? "border-cyan-500 text-cyan-500 bg-cyan-50" : "border-cyan-300 text-cyan-400 hover:border-cyan-400 hover:text-cyan-500"
          )}
        >
          <Plus className="w-3 h-3" />
        </button>
        
        {/* Add rule editor popup */}
        {showAddRule && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
            <InlineRuleEditor 
              onSave={handleAddRule}
              onCancel={() => setShowAddRule(false)}
            />
          </div>
        )}
      </div>
      
      {/* Rule branches */}
      {hasRules && (
        <div className="relative mt-3">
          {/* Horizontal connector line */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 bg-cyan-400"
            style={{ width: rules.length > 1 ? `${(rules.length - 1) * 140 + 20}px` : '0' }}
          />
          
          <div className="flex gap-4 pt-4">
            {rules.map((rule, index) => (
              <RuleBranch 
                key={rule.id} 
                rule={rule}
                isFirst={index === 0}
                isLast={index === rules.length - 1}
                isExpanded={expandedSubBlocks.has(rule.id)}
                onToggle={() => onToggleSubBlock(rule.id)}
                isEditing={editingRuleId === rule.id}
                onStartEdit={() => setEditingRuleId(rule.id)}
                onSaveEdit={handleUpdateRule}
                onCancelEdit={() => setEditingRuleId(null)}
                onDelete={() => handleDeleteRule(rule.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {!hasRules && (
        <div className="mt-3 text-[10px] text-gray-400 px-3 py-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          No rules defined
        </div>
      )}
    </div>
  );
}

function RuleBranch({ 
  rule, 
  isExpanded, 
  onToggle,
  depth = 0,
  isEditing = false,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: { 
  rule: BlockRule; 
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  depth?: number;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onSaveEdit?: (rule: BlockRule) => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
}) {
  const addedTasks = rule.action.addedTasks || (rule.action.addedTask ? [rule.action.addedTask] : []);
  const blockTemplate = rule.action.addedBlockTemplateId ? blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId) : null;
  const isAddBlock = rule.action.type === 'add_block' && blockTemplate;
  const templateTasks = blockTemplate?.suggestedTasks || [];
  const templateRules = blockTemplate?.rules || [];
  const hasNestedRules = templateRules.length > 0;
  
  // Opacity decreases with depth for visual hierarchy
  const depthOpacity = Math.max(0.6, 1 - depth * 0.15);
  
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 130, opacity: depthOpacity }}>
      {/* Vertical connector from horizontal line */}
      <div className="w-0.5 h-4 bg-cyan-400 -mt-4" />
      
      {/* Rule Node - clickable for editing */}
      <div className="relative">
        <div 
          onClick={(e) => { e.stopPropagation(); onStartEdit?.(); }}
          className={cn(
            "bg-white rounded-lg shadow-sm border-2 border-dashed p-2.5 min-w-[120px] max-w-[140px] cursor-pointer transition-all",
            isEditing ? "border-cyan-500 ring-2 ring-cyan-200" : "border-cyan-200 hover:border-cyan-400 hover:shadow-md"
          )}
        >
          <div className="text-[10px] text-gray-600 mb-1.5">
            <span className="font-semibold text-cyan-600">SI</span>
            <span className="capitalize"> {rule.condition.attribute}</span>
            <span className="text-gray-400"> = </span>
            <span className="text-cyan-600 font-medium truncate block">
              {typeof rule.condition.value === 'string' ? rule.condition.value || '...' : '...'}
            </span>
          </div>
          <div className="text-[9px] text-gray-500 font-medium">
            → {rule.action.type === 'add_task' ? 'Add tasks' : 'Add block'}
          </div>
        </div>
        
        {/* Inline editor popup */}
        {isEditing && onSaveEdit && onCancelEdit && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <InlineRuleEditor 
              rule={rule}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
      
      {/* Connector to result */}
      <div className="w-0.5 h-4 bg-emerald-400" />
      
      {/* Result Node */}
      {isAddBlock ? (
        <div className="flex flex-col items-center">
          <div 
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
              "bg-white rounded-lg shadow-sm border-l-2 border border-gray-200 p-2.5 min-w-[120px] max-w-[180px] cursor-pointer hover:shadow-md transition-all relative",
              getCategoryConfig(blockTemplate.category).border
            )}
          >
            {/* Nested rules indicator */}
            {hasNestedRules && (
              <div className="absolute -top-1.5 -right-1.5 z-10">
                <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center shadow-sm" title={`${templateRules.length} nested rule(s)`}>
                  <GitBranch className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-[9px] font-semibold text-purple-700">Sub-block</span>
              </div>
              {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
            </div>
            <div className="text-[10px] font-medium text-gray-700 truncate">{blockTemplate.name}</div>
            <div className="flex items-center gap-2 text-[9px] text-gray-400">
              <span>{templateTasks.length} tasks</span>
              {hasNestedRules && (
                <span className="text-purple-500 font-medium">{templateRules.length} rule{templateRules.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            {/* Preview of nested rules when collapsed */}
            {hasNestedRules && !isExpanded && (
              <div className="mt-2 pt-2 border-t border-purple-100">
                <div className="text-[8px] text-purple-600 font-medium mb-1">Condiciones internas:</div>
                {templateRules.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-[7px] text-purple-500 truncate">
                    • SI {r.condition.attribute} = {r.condition.value}
                  </div>
                ))}
                {templateRules.length > 2 && (
                  <div className="text-[7px] text-purple-400">+{templateRules.length - 2} more...</div>
                )}
              </div>
            )}
          </div>
          
          {/* Expanded sub-block content with nested tree */}
          {isExpanded && (
            <div className="mt-2 flex flex-col items-center">
              {/* Tasks list */}
              {templateTasks.length > 0 && (
                <>
                  <div className="w-0.5 h-3 bg-gray-300" />
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 min-w-[140px]">
                    <div className="text-[9px] font-medium text-gray-600 mb-1">Tasks:</div>
                    {templateTasks.slice(0, 3).map((task, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[8px] text-gray-500">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: getCategoryConfig(blockTemplate.category).accent }} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {templateTasks.length > 3 && (
                      <div className="text-[8px] text-gray-400 pl-2">+{templateTasks.length - 3} more</div>
                    )}
                  </div>
                </>
              )}
              
              {/* Nested rules tree */}
              {hasNestedRules && depth < 2 && (
                <>
                  <div className="w-0.5 h-3 bg-purple-300" />
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <div className="w-0.5 h-3 bg-purple-300" />
                  
                  <div className="bg-purple-50/50 rounded-lg border border-purple-200 p-2 min-w-[160px]">
                    <div className="flex items-center gap-1 text-[9px] font-medium text-purple-700 mb-2">
                      <Diamond className="w-3 h-3" />
                      <span>Condiciones anidadas</span>
                    </div>
                    
                    {/* Nested rule branches */}
                    <div className="flex gap-3 justify-center flex-wrap">
                      {templateRules.map((nestedRule) => (
                        <NestedRuleMini key={nestedRule.id} rule={nestedRule} depth={depth + 1} />
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Too deep indicator */}
              {hasNestedRules && depth >= 2 && (
                <>
                  <div className="w-0.5 h-3 bg-purple-200" />
                  <div className="bg-purple-100 rounded-lg border border-dashed border-purple-300 px-3 py-1.5">
                    <div className="flex items-center gap-1 text-[8px] text-purple-600">
                      <GitBranch className="w-3 h-3" />
                      <span>{templateRules.length} deeper rule(s)...</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-lg shadow-sm border border-emerald-200 p-2.5 min-w-[120px] max-w-[140px]">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-4 h-4 rounded bg-emerald-100 flex items-center justify-center">
              <FileText className="w-2.5 h-2.5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-emerald-700">{addedTasks.length} task{addedTasks.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-0.5">
            {addedTasks.slice(0, 2).map((task, i) => (
              <div key={i} className="text-[9px] text-emerald-600 truncate flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                {task.title || 'Untitled'}
              </div>
            ))}
            {addedTasks.length > 2 && <div className="text-[8px] text-emerald-500">+{addedTasks.length - 2} more</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// Mini version of nested rule for display inside expanded sub-blocks
function NestedRuleMini({ rule, depth }: { rule: { id: string; label: string; condition: { attribute: string; value: string }; action: { type: string; addedBlockTemplateId?: string } }; depth: number }) {
  const nestedTemplate = rule.action.addedBlockTemplateId 
    ? blockTemplates.find(t => t.id === rule.action.addedBlockTemplateId) 
    : null;
  const hasDeepNesting = nestedTemplate?.rules && nestedTemplate.rules.length > 0;
  
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white rounded border border-purple-200 p-1.5 min-w-[100px]">
        <div className="text-[8px] text-gray-500">
          <span className="text-purple-600 font-medium">SI</span> {rule.condition.attribute} = <span className="text-purple-600">{rule.condition.value}</span>
        </div>
        <div className="text-[7px] text-gray-400 mt-0.5">
          → {rule.action.type === 'add_task' ? 'tasks' : nestedTemplate?.name || 'block'}
          {hasDeepNesting && (
            <span className="text-purple-500 ml-1">
              <GitBranch className="w-2 h-2 inline" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============== NODE COMPONENTS ==============

function StartNode({ data }: { data: { onAddBlock: () => void } }) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <>
      <div className="flex items-center gap-2 px-5 py-3 rounded-full bg-white text-gray-800 font-semibold shadow-md border border-gray-200">
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Play className="w-3 h-3 text-white" />
        </div>
        <span>Journey Start</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-white !border-2 !border-primary !rounded-full !-bottom-1.5" />
      
      {/* + button to add first block */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); data.onAddBlock(); }}
          className="w-5 h-5 rounded-full bg-white text-gray-400 hover:text-primary hover:bg-primary/10 border border-gray-300 hover:border-primary flex items-center justify-center transition-all shadow-sm"
          title="Add first block"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </>
  );
}

function WaitNode({ data }: { data: { label: string; offsetDays: number; periodId: string; onAddBlock?: (periodId: string) => void } }) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 !rounded-full !-top-1.5" />
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm group">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Timer className="w-4 h-4 text-gray-500" />
        </div>
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Esperar</div>
          <div className="text-sm font-semibold text-gray-700">{data.label}</div>
        </div>
        <div className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-medium">
          {data.offsetDays === 0 ? 'Day 0' : data.offsetDays > 0 ? `+${data.offsetDays}d` : `${data.offsetDays}d`}
        </div>
        {data.onAddBlock && (
          <button
            onClick={(e) => { e.stopPropagation(); data.onAddBlock?.(data.periodId); }}
            className="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            title="Add block to this period"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-white !border-2 !border-gray-400 !rounded-full !-bottom-1.5" />
    </>
  );
}

function BlockNode({ data }: { 
  data: { 
    block: Block; 
    tasks: { id: string; title: string }[];
    accent: string; 
    borderClass: string; 
    badgeClass: string; 
    bgClass: string;
    IconComponent: React.ElementType;
    isExpanded: boolean;
    expandedSubBlocks: string[];
    onToggle: () => void;
    onToggleSubBlock: (ruleId: string) => void;
    hasPreviousPeriodDeps: boolean;
    previousPeriodDepNames: string[];
    onAddRule: (blockId: string, rule: BlockRule) => void;
    onUpdateRule: (blockId: string, ruleId: string, rule: BlockRule) => void;
    onDeleteRule: (blockId: string, ruleId: string) => void;
    onUpdateDependencies: (blockId: string, dependencies: string[]) => void;
    allBlocks: Block[];
    periods: { id: string; label: string; offsetDays: number }[];
  } 
}) {
  const { block, tasks, accent, borderClass, badgeClass, bgClass, IconComponent, isExpanded, expandedSubBlocks, onToggle, onToggleSubBlock, hasPreviousPeriodDeps, previousPeriodDepNames, onAddRule, onUpdateRule, onDeleteRule, onUpdateDependencies, allBlocks, periods } = data;
  const hasRules = block.rules.length > 0;
  const hasDeps = block.dependencyBlockIds.length > 0;
  const expandedSubBlocksSet = new Set(expandedSubBlocks);
  const [showDepEditor, setShowDepEditor] = useState(false);
  
  // Calculate width based on rules when expanded
  const expandedWidth = Math.max(340, block.rules.length * 150 + 60);
  
  // Find blocks that depend on this one (children)
  const childBlocks = allBlocks.filter(b => b.dependencyBlockIds.includes(block.id));
  const hasChildren = childBlocks.length > 0;
  
  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-white !border-2 !rounded-full !-top-1.5" style={{ borderColor: accent }} />
      <div 
        className={cn(
          "bg-white rounded-xl border-l-4 shadow-md transition-all relative",
          borderClass,
          isExpanded ? "shadow-xl" : "hover:shadow-lg"
        )} 
        style={{ 
          width: isExpanded ? expandedWidth : NODE_WIDTH, 
          zIndex: isExpanded ? 100 : 1 
        }}
      >
        <div className="absolute -top-2.5 left-4 z-10">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border", badgeClass)}>
            <IconComponent className="w-3 h-3" />
            {block.category || 'Block'}
          </span>
        </div>
        
        {/* Previous period dependency indicator */}
        {hasPreviousPeriodDeps && (
          <div className="absolute -top-2.5 right-4 z-10 group">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 cursor-help">
              <Timer className="w-3 h-3" />
              <span>+dep</span>
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-50">
              <div className="bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                <div className="font-medium mb-1">Depends on previous period:</div>
                {previousPeriodDepNames.map((name, i) => (
                  <div key={i} className="text-gray-300">• {name}</div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className={cn("pt-5 px-4 pb-3 rounded-t-xl", isExpanded && bgClass)}>
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-gray-800 text-sm leading-tight flex-1">{block.name}</h4>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="p-1 hover:bg-white/50 rounded transition-colors flex-shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
            </button>
          </div>
          
          {!isExpanded && (
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                <span>{tasks.length} tasks</span>
              </div>
              {hasRules && (
                <div className="flex items-center gap-1 text-cyan-600">
                  <GitBranch className="w-3 h-3" />
                  <span>{block.rules.length} rules</span>
                </div>
              )}
              {hasDeps && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Layers className="w-3 h-3" />
                  <span>{block.dependencyBlockIds.length} dep</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Expanded Tree View */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50/80 to-white rounded-b-xl overflow-hidden">
            <InternalTreeView 
              tasks={tasks} 
              rules={block.rules} 
              accent={accent}
              expandedSubBlocks={expandedSubBlocksSet}
              onToggleSubBlock={onToggleSubBlock}
              blockId={block.id}
              onAddRule={onAddRule}
              onUpdateRule={onUpdateRule}
              onDeleteRule={onDeleteRule}
            />
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-white !border-2 !rounded-full !-bottom-1.5" style={{ borderColor: accent }} />
      
      {/* Bottom + button for connecting to next blocks */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); setShowDepEditor(!showDepEditor); }}
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm",
            showDepEditor 
              ? "bg-blue-500 text-white"
              : hasChildren 
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-300"
                : "bg-white text-gray-400 hover:text-blue-500 hover:bg-blue-50 border border-gray-300"
          )}
          title={hasChildren ? `${childBlocks.length} following block(s) - click to edit` : "Connect next block"}
        >
          <Plus className="w-3 h-3" />
        </button>
        
        {/* Next blocks editor popup */}
        {showDepEditor && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <InlineNextBlockEditor
              currentBlockId={block.id}
              currentChildren={childBlocks.map(b => b.id)}
              availableBlocks={allBlocks}
              periods={periods}
              onSave={onUpdateDependencies}
              onCancel={() => setShowDepEditor(false)}
            />
          </div>
        )}
      </div>
    </>
  );
}

const nodeTypes = { startNode: StartNode, waitNode: WaitNode, blockNode: BlockNode };

// ============== MAIN COMPONENT ==============

export function TreeView({ journey, onBlockEdit }: TreeViewProps) {
  const { getBlocksByJourneyId, getTasksByBlockId, addRule, updateRule, deleteRule, updateBlock } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [expandedSubBlocks, setExpandedSubBlocks] = useState<Set<string>>(new Set());
  const [addBlockModal, setAddBlockModal] = useState<{ open: boolean; periodId: string }>({ open: false, periodId: '' });

  // Rule editing handlers
  const handleAddRule = useCallback((blockId: string, rule: BlockRule) => {
    addRule(blockId, rule);
  }, [addRule]);

  const handleUpdateRule = useCallback((blockId: string, ruleId: string, rule: BlockRule) => {
    updateRule(blockId, ruleId, rule);
  }, [updateRule]);

  const handleDeleteRule = useCallback((blockId: string, ruleId: string) => {
    deleteRule(blockId, ruleId);
  }, [deleteRule]);

  const handleUpdateDependencies = useCallback((blockId: string, dependencies: string[]) => {
    updateBlock(blockId, { dependencyBlockIds: dependencies });
  }, [updateBlock]);

  const sortedPeriods = useMemo(() => [...journey.periods].sort((a, b) => a.offsetDays - b.offsetDays), [journey.periods]);

  const toggleBlock = useCallback((blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }, []);

  const toggleSubBlock = useCallback((ruleId: string) => {
    setExpandedSubBlocks(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedBlocks(new Set(blocks.map(b => b.id)));
    // Expand all sub-blocks including nested ones from templates
    const allSubBlocks = new Set<string>();
    blocks.forEach(b => b.rules.forEach(r => {
      if (r.action.type === 'add_block') {
        allSubBlocks.add(r.id);
        // Also expand nested rules from templates
        const template = blockTemplates.find(t => t.id === r.action.addedBlockTemplateId);
        if (template?.rules) {
          template.rules.forEach(nestedRule => {
            if (nestedRule.action.type === 'add_block') {
              allSubBlocks.add(nestedRule.id);
            }
          });
        }
      }
    }));
    setExpandedSubBlocks(allSubBlocks);
  }, [blocks]);

  const collapseAll = useCallback(() => {
    setExpandedBlocks(new Set());
    setExpandedSubBlocks(new Set());
  }, []);

  const blockTasks = useMemo(() => {
    const map = new Map<string, { id: string; title: string }[]>();
    blocks.forEach(b => map.set(b.id, getTasksByBlockId(b.id)));
    return map;
  }, [blocks, getTasksByBlockId]);

  const expandedBlocksArray = useMemo(() => Array.from(expandedBlocks), [expandedBlocks]);
  const expandedSubBlocksArray = useMemo(() => Array.from(expandedSubBlocks), [expandedSubBlocks]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const openAddBlockForFirstPeriod = () => setAddBlockModal({ open: true, periodId: sortedPeriods[0]?.id || '' });
    
    if (blocks.length === 0) {
      nodes.push({ id: 'start', type: 'startNode', position: { x: 0, y: 0 }, data: { onAddBlock: openAddBlockForFirstPeriod } });
      return { nodes, edges };
    }

    // Group blocks by period
    const blocksByPeriod = groupBlocksByPeriod(blocks, sortedPeriods);
    const minimizedDeps = minimizeDependencies(blocks);
    const allBlockIds = new Set(blocks.map(b => b.id));
    
    // Convert to Set for easier lookup
    const expandedBlocksSet = new Set(expandedBlocksArray);
    const expandedSubBlocksSet = new Set(expandedSubBlocksArray);
    
    let currentY = 0;
    let lastRowBlockIds: string[] = [];
    let previousWaitNodeId: string | null = null;
    
    // Start node
    nodes.push({ id: 'start', type: 'startNode', position: { x: -100, y: currentY }, data: { onAddBlock: openAddBlockForFirstPeriod } });
    currentY += 100;
    
    // Process each period in order
    sortedPeriods.forEach((period, periodIndex) => {
      const periodBlocks = blocksByPeriod.get(period.id) || [];
      
      // Add wait node before this period (except for first period)
      if (periodIndex > 0) {
        const prevPeriod = sortedPeriods[periodIndex - 1];
        // Only add wait node if offsetDays changed
        if (period.offsetDays !== prevPeriod.offsetDays) {
          const waitNodeId = `wait-${period.id}`;
          nodes.push({
            id: waitNodeId,
            type: 'waitNode',
            position: { x: -100, y: currentY },
            data: { 
              label: period.label, 
              offsetDays: period.offsetDays,
              periodId: period.id,
              onAddBlock: (pId: string) => setAddBlockModal({ open: true, periodId: pId }),
            },
          });
          
          // Connect last row blocks to wait node
          if (lastRowBlockIds.length > 0) {
            lastRowBlockIds.forEach(blockId => {
              edges.push({
                id: `e-${blockId}-${waitNodeId}`,
                source: blockId, target: waitNodeId,
                type: 'smoothstep', animated: true,
                style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '6,4' },
              });
            });
          } else if (previousWaitNodeId) {
            edges.push({
              id: `e-${previousWaitNodeId}-${waitNodeId}`,
              source: previousWaitNodeId, target: waitNodeId,
              type: 'smoothstep', animated: true,
              style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '6,4' },
            });
          } else {
            edges.push({
              id: `e-start-${waitNodeId}`,
              source: 'start', target: waitNodeId,
              type: 'smoothstep', animated: true,
              style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '6,4' },
            });
          }
          
          previousWaitNodeId = waitNodeId;
          lastRowBlockIds = [];
          currentY += 55 + VERTICAL_GAP;
        }
      }
      
      // Skip if no blocks in this period
      if (periodBlocks.length === 0) return;
      
      // Calculate dependency levels within this period
      const depLevels = calculateDependencyLevels(periodBlocks, allBlockIds);
      const levelGroups = groupByDependencyLevel(periodBlocks, depLevels);
      const maxLevel = Math.max(...Array.from(depLevels.values()));
      
      // Track previous level block IDs for sorting
      let previousLevelBlockIds: string[] = [];
      
      // Process each dependency level (row) within this period
      for (let level = 0; level <= maxLevel; level++) {
        let levelBlocks = levelGroups.get(level) || [];
        if (levelBlocks.length === 0) continue;
        
        // Sort blocks to minimize edge crossings
        levelBlocks = sortBlocksToMinimizeCrossings(levelBlocks, previousLevelBlockIds, minimizedDeps);
        
        // Calculate dynamic widths for this row
        const blockWidths = levelBlocks.map(block => {
          const isExpanded = expandedBlocksSet.has(block.id);
          return calculateBlockWidth(block, isExpanded);
        });
        
        const totalWidth = blockWidths.reduce((sum, w) => sum + w, 0) + (levelBlocks.length - 1) * HORIZONTAL_GAP;
        let currentX = -totalWidth / 2;
        
        // Track max height for this row
        let maxHeightInRow = NODE_HEIGHT_COLLAPSED;
        
        // Pre-calculate current period block IDs
        const currentPeriodBlockIds = new Set(periodBlocks.map(b => b.id));
        
        // Add block nodes for this level
        levelBlocks.forEach((block, idx) => {
          const config = getCategoryConfig(block.category);
          const tasks = blockTasks.get(block.id) || [];
          const isExpanded = expandedBlocksSet.has(block.id);
          const blockHeight = calculateBlockHeight(block, isExpanded, expandedSubBlocksSet);
          
          // Get dependencies and separate by period
          const deps = minimizedDeps.get(block.id) || [];
          const depsInCurrentPeriod = deps.filter(d => currentPeriodBlockIds.has(d));
          const depsInPreviousPeriods = deps.filter(d => !currentPeriodBlockIds.has(d));
          
          // Get names of previous period dependencies for tooltip
          const previousPeriodDepNames = depsInPreviousPeriods.map(depId => {
            const depBlock = blocks.find(b => b.id === depId);
            return depBlock?.name || depId;
          });
          
          maxHeightInRow = Math.max(maxHeightInRow, blockHeight);
          
          nodes.push({
            id: block.id,
            type: 'blockNode',
            position: { x: currentX, y: currentY },
            data: { 
              block, 
              tasks,
              accent: config.accent,
              borderClass: config.border,
              badgeClass: config.badge,
              bgClass: config.bg,
              IconComponent: config.icon,
              isExpanded,
              expandedSubBlocks: expandedSubBlocksArray,
              onToggle: () => toggleBlock(block.id),
              onToggleSubBlock: toggleSubBlock,
              hasPreviousPeriodDeps: depsInPreviousPeriods.length > 0,
              previousPeriodDepNames,
              onAddRule: handleAddRule,
              onUpdateRule: handleUpdateRule,
              onDeleteRule: handleDeleteRule,
              onUpdateDependencies: handleUpdateDependencies,
              allBlocks: blocks,
              periods: sortedPeriods,
            },
          });
          
          // Create edges for this block
          // If block has dependencies in CURRENT period, connect to those
          if (depsInCurrentPeriod.length > 0) {
            depsInCurrentPeriod.forEach(depId => {
              edges.push({
                id: `e-${depId}-${block.id}`,
                source: depId, target: block.id,
                type: 'smoothstep', animated: true,
                style: { stroke: config.accent, strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: config.accent, width: 10, height: 10 },
              });
            });
          } else {
            // No deps in current period - connect to wait node or start
            // (deps in previous periods are implicit through the wait node)
            const sourceId = previousWaitNodeId || 'start';
            edges.push({
              id: `e-${sourceId}-${block.id}`,
              source: sourceId, target: block.id,
              type: 'smoothstep', animated: true,
              style: { stroke: config.accent, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: config.accent, width: 10, height: 10 },
            });
          }
          
          currentX += blockWidths[idx] + HORIZONTAL_GAP;
        });
        
        // Update previous level block IDs for next iteration
        previousLevelBlockIds = levelBlocks.map(b => b.id);
        
        // Track blocks from this row (last level of this period will connect to next wait)
        lastRowBlockIds = levelBlocks.map(b => b.id);
        
        // Move Y for next row
        currentY += maxHeightInRow + VERTICAL_GAP;
      }
    });
    
    return { nodes, edges };
  }, [blocks, sortedPeriods, blockTasks, expandedBlocksArray, expandedSubBlocksArray, toggleBlock, toggleSubBlock]);

  const handleNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'blockNode') {
      onBlockEdit(node.id);
    }
  }, [onBlockEdit]);

  return (
    <div className="w-full h-full relative bg-gray-50" style={{ minHeight: '500px' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeDoubleClick={handleNodeDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={true}
          nodesConnectable={false}
          className="w-full h-full"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
          <Controls className="!bg-white !border !border-gray-200 !rounded-lg !shadow-sm" />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-10">
        <button onClick={expandAll} className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow font-medium text-xs">
          <ChevronDown className="w-3.5 h-3.5" />Expand All
        </button>
        <button onClick={collapseAll} className="bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow font-medium text-xs">
          <ChevronRight className="w-3.5 h-3.5" />Collapse All
        </button>
      </div>

      
      {/* Help */}
      <div className="absolute top-6 left-6 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 z-10">
        <div className="text-xs text-gray-500 space-y-1">
          <div><span className="font-medium">Click ▶</span> expand block</div>
          <div><span className="font-medium">Doble click</span> abrir editor completo</div>
          <div><span className="font-medium">Click + below</span> connect next block</div>
          <div><span className="font-medium">Click + rules</span> add audience rule</div>
        </div>
      </div>

      {addBlockModal.open && (
        <AddBlockModal 
          isOpen={addBlockModal.open} 
          onClose={() => setAddBlockModal({ open: false, periodId: '' })}
          journeyId={journey.id} 
          periodId={addBlockModal.periodId} 
          onBlockCreated={(blockId) => { setAddBlockModal({ open: false, periodId: '' }); onBlockEdit(blockId); }} 
        />
      )}
    </div>
  );
}
