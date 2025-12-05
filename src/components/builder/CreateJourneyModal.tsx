import { useState } from 'react';
import { Journey, JourneyType, AnchorEvent, Period, EligibilityCriterion } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, X, Users, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (journeyId: string) => void;
}

const journeyTypes: { value: JourneyType; label: string; icon: string }[] = [
  { value: 'onboarding', label: 'Onboarding', icon: '🚀' },
  { value: 'offboarding', label: 'Offboarding', icon: '👋' },
  { value: 'promotion', label: 'Promotion', icon: '⭐' },
  { value: 'role_change', label: 'Role Change', icon: '🔄' },
  { value: 'performance_cycle', label: 'Performance Cycle', icon: '📊' },
  { value: 'custom', label: 'Custom', icon: '📋' },
];

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

export function CreateJourneyModal({ isOpen, onClose, onCreated }: CreateJourneyModalProps) {
  const { addJourney } = useJourneyStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<JourneyType>('onboarding');
  const [anchorEvent, setAnchorEvent] = useState<AnchorEvent>('start_date');
  const [eligibilityCriteria, setEligibilityCriteria] = useState<EligibilityCriterion[]>([]);
  const [showEligibility, setShowEligibility] = useState(false);

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

  const handleCreate = () => {
    const defaultPeriods: Period[] = [
      { id: `period-${Date.now()}-1`, label: 'Day 0', offsetDays: 0, order: 0 },
      { id: `period-${Date.now()}-2`, label: '+7 days', offsetDays: 7, order: 1 },
      { id: `period-${Date.now()}-3`, label: '+30 days', offsetDays: 30, order: 2 },
    ];

    const journey: Journey = {
      id: `journey-${Date.now()}`,
      name: name || 'New Journey',
      type,
      anchorEvent,
      periods: defaultPeriods,
      blockIds: [],
      status: 'draft',
      eligibilityCriteria: eligibilityCriteria.length > 0 ? eligibilityCriteria : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addJourney(journey);
    onCreated(journey.id);
    onClose();
    setName('');
    setType('onboarding');
    setAnchorEvent('start_date');
    setEligibilityCriteria([]);
    setShowEligibility(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold">Create New Journey</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Journey Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Engineering Onboarding"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Journey Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {journeyTypes.map((jt) => (
                <button
                  key={jt.value}
                  onClick={() => setType(jt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center",
                    type === jt.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <span className="text-xl">{jt.icon}</span>
                  <span className="text-xs font-medium">{jt.label}</span>
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
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-foreground">
                  Eligibility Criteria
                </label>
                <span className="text-xs text-gray-400">(optional)</span>
              </div>
              {!showEligibility && eligibilityCriteria.length === 0 && (
                <button
                  onClick={() => setShowEligibility(true)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add filter
                </button>
              )}
            </div>

            {(showEligibility || eligibilityCriteria.length > 0) && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 mb-2">
                  Define which employees are eligible for this journey
                </p>

                {eligibilityCriteria.map((criterion, idx) => (
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

                {eligibilityCriteria.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                    <Users className="w-4 h-4" />
                    <span>
                      This journey will only apply to employees who meet {eligibilityCriteria.length === 1 ? 'this condition' : 'all these conditions'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary">
            Create Journey
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
