import { useState } from 'react';
import { Block, Task, BlockRule } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Plus, Trash2, GripVertical, List, GitBranch, Users, Bell, Link2, Settings, Diamond } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string | null;
}

type TreeNodeSelection = 'block' | 'decision' | `rule-${string}`;

export function BlockEditorModal({ isOpen, onClose, blockId }: BlockEditorModalProps) {
  const { 
    getBlockById, 
    getTasksByBlockId, 
    updateBlock, 
    addTask, 
    updateTask, 
    deleteTask,
    addRule,
    deleteRule,
    updateRule,
    getJourneyById,
    blocks,
  } = useJourneyStore();

  const block = blockId ? getBlockById(blockId) : null;
  const tasks = blockId ? getTasksByBlockId(blockId) : [];
  const journey = block ? getJourneyById(block.journeyId) : null;
  const otherBlocks = blocks.filter((b) => b.id !== blockId && b.journeyId === block?.journeyId);

  const [blockViewMode, setBlockViewMode] = useState<'inline' | 'tree'>('inline');
  const [selectedNode, setSelectedNode] = useState<TreeNodeSelection>('block');
  const [activeInlineTab, setActiveInlineTab] = useState<'tasks' | 'deps' | 'notifications'>('tasks');

  if (!block || !journey) return null;

  const handleNameChange = (name: string) => {
    updateBlock(block.id, { name });
  };

  const handlePeriodChange = (periodId: string) => {
    updateBlock(block.id, { periodId });
  };

  const handleSlaChange = (days: number) => {
    updateBlock(block.id, { expectedDurationDays: days });
  };

  const handleAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      blockId: block.id,
      title: 'Nueva tarea',
      type: 'basic',
      assigneeType: 'employee',
      order: tasks.length,
    };
    addTask(newTask);
  };

  const handleDependencyToggle = (depBlockId: string) => {
    const deps = block.dependencyBlockIds.includes(depBlockId)
      ? block.dependencyBlockIds.filter((id) => id !== depBlockId)
      : [...block.dependencyBlockIds, depBlockId];
    updateBlock(block.id, { dependencyBlockIds: deps });
  };

  const handleAddRule = () => {
    const newRule: BlockRule = {
      id: `rule-${Date.now()}`,
      label: 'Nueva regla',
      condition: { attribute: 'department', operator: 'equals', value: '' },
      action: { type: 'add_task' },
    };
    addRule(block.id, newRule);
  };

  const selectedRule = selectedNode.startsWith('rule-') 
    ? block.rules.find(r => r.id === selectedNode.replace('rule-', ''))
    : null;

  // INLINE VIEW
  const renderInlineView = () => (
    <>
      {/* Basic Info */}
      <div className="p-6 space-y-4 border-b border-border">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Nombre del bloque</label>
          <input
            type="text"
            value={block.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Período</label>
            <select
              value={block.periodId}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {journey.periods.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">SLA</label>
            <div className="relative">
              <input
                type="number"
                value={block.expectedDurationDays || ''}
                onChange={(e) => handleSlaChange(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full h-10 px-3 pr-12 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">días</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Tabs */}
      <div className="border-b border-border">
        <div className="flex px-6">
          {[
            { id: 'tasks' as const, label: 'Tareas', count: tasks.length },
            { id: 'deps' as const, label: 'Dependencias', count: block.dependencyBlockIds.length },
            { id: 'notifications' as const, label: 'Notificaciones', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveInlineTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeInlineTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeInlineTab === 'tasks' && renderTasksEditor()}
        {activeInlineTab === 'deps' && renderDependenciesEditor()}
        {activeInlineTab === 'notifications' && renderNotificationsEditor()}

        {/* Audience Rules Section */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Reglas de audiencia
          </h3>
          {renderAudienceRulesEditor()}
        </div>
      </div>
    </>
  );

  // TREE VIEW
  const renderTreeView = () => (
    <div className="flex h-[500px]">
      {/* Tree Visualization */}
      <div className="w-1/2 p-6 border-r border-border bg-muted/20 overflow-auto">
        <div className="flex flex-col items-center min-h-full">
          {/* Main Block Node */}
          <button
            onClick={() => setSelectedNode('block')}
            className={cn(
              "px-5 py-3 rounded-lg text-sm font-medium shadow-sm min-w-[180px] text-center transition-all border-2",
              selectedNode === 'block'
                ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30"
                : "bg-background border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Settings className="w-4 h-4" />
              {block.name}
            </div>
            <div className="text-xs opacity-70">{tasks.length} tareas • {block.dependencyBlockIds.length} deps</div>
          </button>

          {/* Connector Line */}
          <div className="w-0.5 h-8 bg-border" />

          {/* Decision Node (Diamond) */}
          <button
            onClick={() => setSelectedNode('decision')}
            className={cn(
              "w-14 h-14 rotate-45 flex items-center justify-center transition-all border-2 shadow-sm",
              selectedNode === 'decision'
                ? "bg-accent border-accent ring-2 ring-accent/30"
                : "bg-background border-border hover:border-accent/50"
            )}
          >
            <span className={cn(
              "-rotate-45 text-xs font-bold",
              selectedNode === 'decision' ? "text-accent-foreground" : "text-muted-foreground"
            )}>
              ?
            </span>
          </button>

          {/* Connector Lines to Branches */}
          <div className="flex items-start mt-2">
            {/* Left connector */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-4 bg-border" />
            </div>
            {/* Horizontal line with branches */}
            <div className="flex items-start gap-0 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-border" style={{ width: `${Math.max(1, block.rules.length) * 120 + 100}px` }} />
            </div>
          </div>

          {/* Branch Nodes */}
          <div className="flex gap-3 mt-4">
            {/* Default Branch (All) */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-border" />
              <div className="px-3 py-2 rounded-lg border-2 border-border bg-background text-xs min-w-[100px] text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span className="font-medium">Todos</span>
                </div>
                <div className="text-foreground">{tasks.length} tareas</div>
              </div>
            </div>

            {/* Rule Branches */}
            {block.rules.map((rule) => (
              <div key={rule.id} className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-accent" />
                <button
                  onClick={() => setSelectedNode(`rule-${rule.id}`)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-xs min-w-[100px] text-center transition-all",
                    selectedNode === `rule-${rule.id}`
                      ? "border-accent bg-accent/10 ring-2 ring-accent/30"
                      : "border-accent/50 bg-accent/5 hover:border-accent"
                  )}
                >
                  <div className="flex items-center justify-center gap-1 text-accent mb-1">
                    <GitBranch className="w-3 h-3" />
                    <span className="font-medium capitalize">{rule.condition.attribute}</span>
                  </div>
                  <div className="text-muted-foreground text-[10px] truncate max-w-[80px]">
                    = {typeof rule.condition.value === 'string' ? rule.condition.value || '...' : '...'}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Panel */}
      <div className="w-1/2 p-6 overflow-auto">
        {selectedNode === 'block' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuración del bloque
            </h3>
            
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
              <input
                type="text"
                value={block.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Período</label>
                <select
                  value={block.periodId}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm"
                >
                  {journey.periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">SLA (días)</label>
                <input
                  type="number"
                  value={block.expectedDurationDays || ''}
                  onChange={(e) => handleSlaChange(parseInt(e.target.value) || 0)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tareas base</h4>
              {renderTasksEditor()}
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Dependencias
              </h4>
              {renderDependenciesEditor()}
            </div>
          </div>
        )}

        {selectedNode === 'decision' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Diamond className="w-4 h-4" />
              Reglas de audiencia
            </h3>
            <p className="text-xs text-muted-foreground">
              Define condiciones que añaden tareas adicionales según las características del empleado.
            </p>
            {renderAudienceRulesEditor()}
          </div>
        )}

        {selectedRule && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-accent" />
                Editar regla
              </h3>
              <button
                onClick={() => {
                  deleteRule(block.id, selectedRule.id);
                  setSelectedNode('decision');
                }}
                className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Condición</label>
              <div className="flex gap-2">
                <select
                  value={selectedRule.condition.attribute}
                  onChange={(e) => updateRule(block.id, selectedRule.id, {
                    ...selectedRule,
                    condition: { ...selectedRule.condition, attribute: e.target.value }
                  })}
                  className="h-9 px-2 rounded border border-border bg-background text-sm"
                >
                  <option value="department">Departamento</option>
                  <option value="location">Ubicación</option>
                  <option value="role">Rol</option>
                  <option value="contract_type">Tipo contrato</option>
                  <option value="seniority">Seniority</option>
                </select>
                <span className="flex items-center text-sm text-muted-foreground">=</span>
                <input
                  type="text"
                  value={typeof selectedRule.condition.value === 'string' ? selectedRule.condition.value : ''}
                  onChange={(e) => updateRule(block.id, selectedRule.id, {
                    ...selectedRule,
                    condition: { ...selectedRule.condition, value: e.target.value }
                  })}
                  placeholder="Valor..."
                  className="flex-1 h-9 px-3 rounded border border-border bg-background text-sm"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Tareas adicionales para esta audiencia</h4>
              <div className="space-y-2">
                {selectedRule.action.addedTask && (
                  <div className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    <span className="text-sm">{selectedRule.action.addedTask.title}</span>
                  </div>
                )}
                <button className="w-full flex items-center justify-center gap-1.5 p-2 rounded border border-dashed border-accent/50 text-xs text-accent hover:bg-accent/5 transition-colors">
                  <Plus className="w-3 h-3" />
                  Añadir tarea condicional
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Shared editor components
  const renderTasksEditor = () => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background group">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
          <input
            type="text"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <select
            value={task.assigneeType}
            onChange={(e) => updateTask(task.id, { assigneeType: e.target.value })}
            className="h-7 px-2 rounded border border-border bg-background text-xs"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr_manager">HR</option>
            <option value="it_admin">IT</option>
          </select>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      ))}
      <button
        onClick={handleAddTask}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Añadir tarea
      </button>
    </div>
  );

  const renderDependenciesEditor = () => (
    <div className="space-y-1.5">
      {otherBlocks.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No hay otros bloques</p>
      ) : (
        otherBlocks.map((b) => (
          <label key={b.id} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={block.dependencyBlockIds.includes(b.id)}
              onChange={() => handleDependencyToggle(b.id)}
              className="w-3.5 h-3.5 rounded border-border"
            />
            <span className="truncate">{b.name}</span>
          </label>
        ))
      )}
    </div>
  );

  const renderNotificationsEditor = () => (
    <div className="text-center py-6">
      <Bell className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground mb-3">Configura notificaciones</p>
      <button className="text-xs text-primary hover:underline">
        <Plus className="w-3 h-3 inline mr-1" />
        Añadir notificación
      </button>
    </div>
  );

  const renderAudienceRulesEditor = () => (
    <div className="space-y-2">
      {block.rules.map((rule) => (
        <div key={rule.id} className="p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-semibold text-accent">SI</span>
            <span className="font-medium capitalize">{rule.condition.attribute}</span>
            <span className="text-muted-foreground">=</span>
            <span>{typeof rule.condition.value === 'string' ? rule.condition.value || '...' : '...'}</span>
            <button
              onClick={() => deleteRule(block.id, rule.id)}
              className="p-1 hover:bg-destructive/10 rounded transition-all ml-auto"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
          {rule.action.addedTask && (
            <div className="mt-2 pl-4 text-xs text-muted-foreground">
              → +1 tarea: {rule.action.addedTask.title}
            </div>
          )}
        </div>
      ))}
      <button
        onClick={handleAddRule}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-accent hover:text-accent transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Nueva regla
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "max-h-[85vh] overflow-hidden flex flex-col p-0",
        blockViewMode === 'tree' ? "max-w-4xl" : "max-w-2xl"
      )}>
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Editar bloque</DialogTitle>
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBlockViewMode('inline')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                    blockViewMode === 'inline'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  Lista
                </button>
                <button
                  onClick={() => setBlockViewMode('tree')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                    blockViewMode === 'tree'
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Árbol
                </button>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {blockViewMode === 'inline' ? renderInlineView() : renderTreeView()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cancelar
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Guardar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}