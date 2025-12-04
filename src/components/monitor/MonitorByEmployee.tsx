import { useState } from 'react';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonitorByEmployeeProps {
  journeyId: string | null;
}

export function MonitorByEmployee({ journeyId }: MonitorByEmployeeProps) {
  const { employees, employeeProgress, journeys, blocks } = useJourneyStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filteredProgress = employeeProgress.filter((p) => {
    if (journeyId && p.journeyId !== journeyId) return false;
    const emp = employees.find((e) => e.id === p.employeeId);
    if (search && emp && !emp.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProgress.length / perPage);
  const paginatedProgress = filteredProgress.slice((page - 1) * perPage, page * perPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-success/10 text-success';
      case 'at_risk': return 'bg-warning/10 text-warning';
      case 'delayed': return 'bg-danger/10 text-danger';
      case 'completed': return 'bg-accent/10 text-accent';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <span className="text-sm text-muted-foreground">{filteredProgress.length} employees</span>
      </div>

      <div className="factorial-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Employee</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Journey</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Current Block</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Progress</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProgress.map((progress) => {
              const emp = employees.find((e) => e.id === progress.employeeId);
              const journey = journeys.find((j) => j.id === progress.journeyId);
              const currentBlock = blocks.find((b) => b.id === progress.currentBlockId);
              const completedPct = journey ? Math.round((progress.completedBlockIds.length / journey.blockIds.length) * 100) : 0;
              
              return (
                <tr key={progress.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-sm font-medium text-accent">
                        {emp?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{emp?.name}</p>
                        <p className="text-xs text-muted-foreground">{emp?.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground">{journey?.name}</td>
                  <td className="p-4 text-sm text-foreground">{currentBlock?.name || '-'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${completedPct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{completedPct}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize", getStatusColor(progress.status))}>
                      {progress.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
