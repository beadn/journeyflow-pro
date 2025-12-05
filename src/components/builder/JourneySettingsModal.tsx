import { useState, useEffect } from 'react';
import { Journey, EligibilityCriterion, JourneyStatus, AnchorEvent } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, Users, Filter, Target, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JourneySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: Journey;
}

const anchorEvents: { value: AnchorEvent; label: string }[] = [
  { value: 'start_date', label: 'Fecha de inicio' },
  { value: 'last_day', label: 'Último día' },
  { value: 'promotion_date', label: 'Fecha de promoción' },
  { value: 'cycle_start', label: 'Inicio de ciclo' },
  { value: 'custom', label: 'Personalizado' },
];

const eligibilityAttributes = [
  { value: 'department', label: 'Departamento' },
  { value: 'location', label: 'Ubicación' },
  { value: 'employeeType', label: 'Tipo de empleado' },
  { value: 'contractType', label: 'Tipo de contrato' },
  { value: 'level', label: 'Nivel' },
];

const operators = [
  { value: 'equals', label: 'es igual a' },
  { value: 'not_equals', label: 'no es igual a' },
  { value: 'in', label: 'está en' },
  { value: 'not_in', label: 'no está en' },
];

const attributeOptions: Record<string, string[]> = {
  department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Product', 'Design'],
  location: ['Remote', 'Madrid', 'Barcelona', 'New York', 'London', 'Berlin'],
  employeeType: ['Full-time', 'Part-time', 'Contractor', 'Intern'],
  contractType: ['Permanent', 'Temporary', 'Freelance'],
  level: ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director', 'VP', 'C-Level'],
};

export function JourneySettingsModal({ isOpen, onClose, journey }: JourneySettingsModalProps) {
  const { updateJourney } = useJourneyStore();
  
  const [name, setName] = useState(journey.name);
  const [description, setDescription] = useState(journey.description || '');
  const [status, setStatus] = useState<JourneyStatus>(journey.status);
  const [anchorEvent, setAnchorEvent] = useState<AnchorEvent>(journey.anchorEvent);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriterion[]>(
    journey.eligibilityCriteria || []
  );

  // Reset form when journey changes
  useEffect(() => {
    setName(journey.name);
    setDescription(journey.description || '');
    setStatus(journey.status);
    setAnchorEvent(journey.anchorEvent);
    setEligibilityCriteria(journey.eligibilityCriteria || []);
  }, [journey]);

  const addCriterion = () => {
    const newCriterion: EligibilityCriterion = {
      id: `criterion-${Date.now()}`,
      attribute: 'department',
      operator: 'equals',
      value: '',
    };
    setEligibilityCriteria([...eligibilityCriteria, newCriterion]);
  };

  const updateCriterion = (id: string, updates: Partial<EligibilityCriterion>) => {
    setEligibilityCriteria(criteria =>
      criteria.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  };

  const removeCriterion = (id: string) => {
    setEligibilityCriteria(criteria => criteria.filter(c => c.id !== id));
  };

  const handleSave = () => {
    updateJourney(journey.id, {
      name,
      description: description || undefined,
      status,
      anchorEvent,
      eligibilityCriteria: eligibilityCriteria.length > 0 ? eligibilityCriteria : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">Configuración del Workflow</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Onboarding de Ingeniería"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el propósito de este workflow..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <div className="flex gap-2">
              {[
                { value: 'draft', label: 'Borrador', color: 'bg-gray-100 border-gray-300 text-gray-700' },
                { value: 'active', label: 'Activo', color: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
                { value: 'archived', label: 'Archivado', color: 'bg-amber-100 border-amber-300 text-amber-700' },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStatus(s.value as JourneyStatus)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    status === s.value
                      ? s.color + ' ring-2 ring-offset-1 ring-indigo-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anchor Event */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Evento ancla
            </label>
            <select
              value={anchorEvent}
              onChange={(e) => setAnchorEvent(e.target.value as AnchorEvent)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {anchorEvents.map((ae) => (
                <option key={ae.value} value={ae.value}>{ae.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Los tiempos del workflow se calculan relativos a este evento
            </p>
          </div>

          {/* Eligibility Criteria */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <label className="text-sm font-medium text-foreground">
                  Condiciones de elegibilidad
                </label>
              </div>
              {eligibilityCriteria.length === 0 && (
                <button
                  onClick={addCriterion}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Añadir filtro
                </button>
              )}
            </div>

            {eligibilityCriteria.length === 0 ? (
              <p className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                Sin condiciones. Todos los empleados son elegibles para este workflow.
              </p>
            ) : (
              <div className="space-y-3">
                {eligibilityCriteria.map((criterion) => (
                  <div 
                    key={criterion.id}
                    className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      {/* Attribute */}
                      <select
                        value={criterion.attribute}
                        onChange={(e) => updateCriterion(criterion.id, { 
                          attribute: e.target.value as EligibilityCriterion['attribute'],
                          value: '' 
                        })}
                        className="h-9 px-2 text-sm rounded-md border border-gray-300 bg-white"
                      >
                        {eligibilityAttributes.map(attr => (
                          <option key={attr.value} value={attr.value}>{attr.label}</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={criterion.operator}
                        onChange={(e) => updateCriterion(criterion.id, { 
                          operator: e.target.value as EligibilityCriterion['operator'] 
                        })}
                        className="h-9 px-2 text-sm rounded-md border border-gray-300 bg-white"
                      >
                        {operators.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {/* Value */}
                      <select
                        value={Array.isArray(criterion.value) ? criterion.value[0] : criterion.value}
                        onChange={(e) => updateCriterion(criterion.id, { value: e.target.value })}
                        className="h-9 px-2 text-sm rounded-md border border-gray-300 bg-white"
                      >
                        <option value="">Seleccionar...</option>
                        {attributeOptions[criterion.attribute]?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => removeCriterion(criterion.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addCriterion}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Añadir condición
                </button>

                <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                  <Users className="w-4 h-4" />
                  <span>
                    Este workflow solo aplicará a empleados que cumplan {eligibilityCriteria.length === 1 ? 'esta condición' : 'todas estas condiciones'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Warning for active journeys */}
          {journey.status === 'active' && status !== 'active' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-700">
                <strong>Atención:</strong> Cambiar el estado de un workflow activo puede afectar a los empleados que están actualmente en él.
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancelar
          </button>
          <button onClick={handleSave} className="btn-primary">
            Guardar cambios
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

