import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { Plus, GitBranch, Activity, Users, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { CreateJourneyModal } from '@/components/builder/CreateJourneyModal';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { journeys, getJourneyMetrics } = useJourneyStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleJourneyCreated = (journeyId: string) => {
    navigate(`/builder/${journeyId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'draft': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'archived': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Lifecycle Workflows</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all your employee journey workflows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Workflow
        </button>
      </div>

      {/* Workflow Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {journeys.map((journey) => {
          const metrics = getJourneyMetrics(journey.id);
          
          return (
            <div
              key={journey.id}
              className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg">{journey.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize mt-0.5">
                      {journey.type.replace('_', ' ')}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(journey.status)}`}>
                    {journey.status}
                  </span>
                </div>
                {journey.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{journey.description}</p>
                )}
              </div>

              {/* Metrics */}
              <div className="p-5 bg-muted/30">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{metrics?.totalEmployees || 0}</p>
                      <p className="text-xs text-muted-foreground">Employees</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{metrics?.completionRate || 0}%</p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{metrics?.averageDuration || 0}d</p>
                      <p className="text-xs text-muted-foreground">Avg. Duration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <div>
                      <p className="text-lg font-semibold text-foreground">{metrics?.atRisk || 0}</p>
                      <p className="text-xs text-muted-foreground">At Risk</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{metrics?.onTrack || 0} on track</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${metrics?.completionRate || 0}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/builder/${journey.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
                  >
                    <GitBranch className="w-4 h-4" />
                    Builder
                  </button>
                  <button
                    onClick={() => navigate(`/monitor/${journey.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    Monitor
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state / Create new card */}
        {journeys.length === 0 && (
          <div
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors min-h-[300px]"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Create your first workflow</h3>
            <p className="text-sm text-muted-foreground text-center">
              Set up onboarding, offboarding, or custom employee journeys
            </p>
          </div>
        )}
      </div>

      <CreateJourneyModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={handleJourneyCreated}
      />
    </div>
  );
}
