import { Journey } from '@/types/journey';
import { ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface JourneySelectorProps {
  journeys: Journey[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}

export function JourneySelector({ journeys, selectedId, onSelect, onCreate }: JourneySelectorProps) {
  const selected = journeys.find((j) => j.id === selectedId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
          <span className="text-sm font-medium">
            {selected?.name || 'Select Journey'}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {journeys.map((journey) => (
          <DropdownMenuItem
            key={journey.id}
            onClick={() => onSelect(journey.id)}
            className="flex items-center justify-between"
          >
            <span>{journey.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{journey.type}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Journey
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
