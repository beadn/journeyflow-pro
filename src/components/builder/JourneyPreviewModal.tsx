import { useState, useMemo } from 'react';
import { Journey, Block, Task, BlockRule } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Eye, User, MapPin, Building2, Briefcase, CheckCircle2, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Journey;
}

interface EmployeeConditions {
  department: string;
  location: string;
  role: string;
  legalEntity: string;
  manager: string;
}

interface PreviewTask extends Partial<Task> {
  isConditional?: boolean;
  ruleLabel?: string;
}

export function JourneyPreviewModal({ isOpen, onClose, journey }: JourneyPreviewModalProps) {
  const { getBlocksByJourneyId, getTasksByBlockId } = useJourneyStore();
  const blocks = getBlocksByJourneyId(journey.id);

  const [conditions, setConditions] = useState<EmployeeConditions>({
    department: '',
    location: '',
    role: '',
    legalEntity: '',
    manager: '',
  });

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

  // Calculate which tasks would execute based on conditions
  const previewData = useMemo(() => {
    return blocks
      .sort((a, b) => {
        const periodA = journey.periods.find(p => p.id === a.periodId);
        const periodB = journey.periods.find(p => p.id === b.periodId);
        return (periodA?.order || 0) - (periodB?.order || 0);
      })
      .map(block => {
        const baseTasks = getTasksByBlockId(block.id);
        const conditionalTasks: PreviewTask[] = [];
        const skippedBlock = { skip: false, reason: '' };

        // Evaluate each rule
        block.rules.forEach(rule => {
          const conditionMet = evaluateCondition(rule, conditions);
          
          if (conditionMet) {
            if (rule.action.type === 'skip_block') {
              skippedBlock.skip = true;
              skippedBlock.reason = rule.label;
            } else if (rule.action.type === 'add_task') {
              // Support both old and new format
              const tasksToAdd = rule.action.addedTasks || (rule.action.addedTask ? [rule.action.addedTask] : []);
              tasksToAdd.forEach(task => {
                conditionalTasks.push({
                  ...task,
                  isConditional: true,
                  ruleLabel: rule.label,
                });
              });
            }
          }
        });

        return {
          block,
          period: journey.periods.find(p => p.id === block.periodId),
          baseTasks,
          conditionalTasks,
          skippedBlock,
          totalTasks: skippedBlock.skip ? 0 : baseTasks.length + conditionalTasks.length,
        };
      });
  }, [blocks, conditions, journey.periods, getTasksByBlockId]);

  const totalTaskCount = previewData.reduce((sum, p) => sum + p.totalTasks, 0);
  const activeBlocks = previewData.filter(p => !p.skippedBlock.skip).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Vista previa del Journey</DialogTitle>
                <p className="text-sm text-muted-foreground">Simula las tareas según condiciones del empleado</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Conditions Panel */}
          <div className="w-80 border-r border-border p-4 space-y-4 bg-muted/30">
            <h3 className="font-medium text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Condiciones del empleado
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
                  <option value="engineering">Engineering</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="hr">HR</option>
                  <option value="finance">Finance</option>
                  <option value="legal">Legal</option>
                  <option value="operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Ubicación
                </label>
                <select
                  value={conditions.location}
                  onChange={(e) => setConditions({ ...conditions, location: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Seleccionar...</option>
                  <option value="madrid">Madrid</option>
                  <option value="barcelona">Barcelona</option>
                  <option value="new_york">New York</option>
                  <option value="london">London</option>
                  <option value="remote">Remote</option>
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
                  <option value="spain">Spain S.L.</option>
                  <option value="usa">USA Inc.</option>
                  <option value="uk">UK Ltd.</option>
                  <option value="germany">Germany GmbH</option>
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
                  placeholder="Nombre del manager"
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t border-border">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-semibold text-primary mb-2">Resumen</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">{activeBlocks}</span> bloques activos</p>
                  <p><span className="font-medium text-foreground">{totalTaskCount}</span> tareas totales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Results */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {previewData.map(({ block, period, baseTasks, conditionalTasks, skippedBlock }) => (
              <div
                key={block.id}
                className={cn(
                  "rounded-lg border transition-all",
                  skippedBlock.skip
                    ? "border-dashed border-muted-foreground/30 bg-muted/20 opacity-60"
                    : "border-border bg-background"
                )}
              >
                {/* Block Header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      skippedBlock.skip ? "bg-muted-foreground" : "bg-primary"
                    )} />
                    <div>
                      <h4 className="font-medium text-sm">{block.name}</h4>
                      <p className="text-xs text-muted-foreground">{period?.label}</p>
                    </div>
                  </div>
                  {skippedBlock.skip ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Omitido: {skippedBlock.reason}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {baseTasks.length + conditionalTasks.length} tareas
                    </span>
                  )}
                </div>

                {/* Tasks */}
                {!skippedBlock.skip && (
                  <div className="p-3 space-y-2">
                    {baseTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1 text-sm">{task.title}</span>
                        <span className="text-xs text-muted-foreground capitalize">{task.assigneeType}</span>
                      </div>
                    ))}
                    
                    {conditionalTasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="flex-1 text-sm">{task.title}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
                          Condicional
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{task.assigneeType}</span>
                      </div>
                    ))}

                    {baseTasks.length === 0 && conditionalTasks.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Sin tareas</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
