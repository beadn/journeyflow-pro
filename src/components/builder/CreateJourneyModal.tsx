import { useState } from 'react';
import { Journey, JourneyType, AnchorEvent, Period } from '@/types/journey';
import { useJourneyStore } from '@/stores/journeyStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

interface CreateJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (journeyId: string) => void;
}

const journeyTypes: { value: JourneyType; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'role_change', label: 'Role Change' },
  { value: 'performance_cycle', label: 'Performance Cycle' },
  { value: 'custom', label: 'Custom' },
];

const anchorEvents: { value: AnchorEvent; label: string }[] = [
  { value: 'start_date', label: 'Start Date' },
  { value: 'last_day', label: 'Last Day' },
  { value: 'promotion_date', label: 'Promotion Date' },
  { value: 'cycle_start', label: 'Cycle Start' },
  { value: 'custom', label: 'Custom' },
];

export function CreateJourneyModal({ isOpen, onClose, onCreated }: CreateJourneyModalProps) {
  const { addJourney } = useJourneyStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<JourneyType>('onboarding');
  const [anchorEvent, setAnchorEvent] = useState<AnchorEvent>('start_date');

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addJourney(journey);
    onCreated(journey.id);
    onClose();
    setName('');
    setType('onboarding');
    setAnchorEvent('start_date');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Create New Journey</DialogTitle>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Journey Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Onboarding"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Journey Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as JourneyType)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {journeyTypes.map((jt) => (
                <option key={jt.value} value={jt.value}>{jt.label}</option>
              ))}
            </select>
          </div>

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
