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
  { value: 'start_date', label: 'Start Date' },
  { value: 'last_day', label: 'Last Day' },
  { value: 'promotion_date', label: 'Promotion Date' },
  { value: 'cycle_start', label: 'Cycle Start' },
  { value: 'custom', label: 'Custom' },
];

const eligibilityAttributes = [
  { value: 'department', label: 'Department' },
  { value: 'location', label: 'Location' },
  { value: 'employeeType', label: 'Employee Type' },
  { value: 'contractType', label: 'Contract Type' },
  { value: 'level', label: 'Level' },
];

const operators = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'in', label: 'is in' },
  { value: 'not_in', label: 'is not in' },
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
          <DialogTitle className="text-lg font-semibold">Journey Settings</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Onboarding"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this journey..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {[
                { value: 'draft', label: 'Draft', color: 'bg-gray-100 border-gray-300 text-gray-700' },
                { value: 'active', label: 'Active', color: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
                { value: 'archived', label: 'Archived', color: 'bg-amber-100 border-amber-300 text-amber-700' },
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
              Anchor Event
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
              Journey timings are calculated relative to this event
            </p>
          </div>

          {/* Eligibility Criteria */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <label className="text-sm font-medium text-foreground">
                  Eligibility Criteria
                </label>
              </div>
              {eligibilityCriteria.length === 0 && (
                <button
                  onClick={addCriterion}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add filter
                </button>
              )}
            </div>

            {eligibilityCriteria.length === 0 ? (
              <p className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No conditions set. All employees are eligible for this journey.
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
                        <option value="">Select...</option>
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
                  Add condition
                </button>

                <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                  <Users className="w-4 h-4" />
                  <span>
                    This journey will only apply to employees who meet {eligibilityCriteria.length === 1 ? 'this condition' : 'all these conditions'}
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
                <strong>Warning:</strong> Changing the status of an active journey may affect employees currently in it.
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            Save Changes
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
