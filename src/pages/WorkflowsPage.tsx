import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Users, 
  Clock, 
  AlertTriangle,
  Flame,
  BarChart3,
  ArrowRight,
  Zap,
  ChevronRight,
  Filter,
  Target
} from 'lucide-react';
import { CreateJourneyModal } from '@/components/builder/CreateJourneyModal';

type StatusFilter = 'all' | 'active' | 'draft' | 'archived';

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const { journeys, getJourneyMetrics } = useJourneyStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Filter journeys
  const filteredJourneys = useMemo(() => {
    if (statusFilter === 'all') return journeys;
    return journeys.filter(j => j.status === statusFilter);
  }, [journeys, statusFilter]);

  // Get journeys that need attention
  const journeysNeedingAttention = useMemo(() => {
    return journeys
      .map(journey => {
        const metrics = getJourneyMetrics(journey.id);
        const problemScore = metrics.delayed * 3 + metrics.atRisk;
        return { journey, metrics, problemScore };
      })
      .filter(item => item.problemScore > 0)
      .sort((a, b) => b.problemScore - a.problemScore)
      .slice(0, 3);
  }, [journeys, getJourneyMetrics]);

  const handleJourneyCreated = (journeyId: string) => {
    navigate(`/journey/${journeyId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'archived': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'onboarding': return '🚀';
      case 'offboarding': return '👋';
      case 'promotion': return '⭐';
      case 'role_change': return '🔄';
      case 'performance_cycle': return '📊';
      default: return '📋';
    }
  };

  const getAttributeLabel = (attr: string) => {
    const labels: Record<string, string> = {
      department: 'Dept',
      location: 'Location',
      employeeType: 'Type',
      contractType: 'Contract',
      level: 'Level',
    };
    return labels[attr] || attr;
  };

  const getOperatorLabel = (op: string) => {
    const labels: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      in: '∈',
      not_in: '∉',
    };
    return labels[op] || op;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Journeys</h1>
            <p className="text-gray-500 mt-1">Manage your employee lifecycle journeys</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-5 h-5" />
            New Journey
          </button>
        </div>

        {/* Alerts Section */}
        {journeysNeedingAttention.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-red-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-gray-900">Needs Attention</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {journeysNeedingAttention.map(({ journey, metrics }) => (
                <div 
                  key={journey.id}
                  onClick={() => navigate(`/journey/${journey.id}`)}
                  className="bg-white rounded-lg p-4 border border-amber-200 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{getTypeIcon(journey.type)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{journey.name}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    {metrics.delayed > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {metrics.delayed} delayed
                      </span>
                    )}
                    {metrics.atRisk > 0 && (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {metrics.atRisk} at risk
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter & Workflows Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Journeys</h2>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'active' as const, label: 'Active' },
                { id: 'draft' as const, label: 'Draft' },
                { id: 'archived' as const, label: 'Archived' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    statusFilter === filter.id 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJourneys.map((journey) => {
            const metrics = getJourneyMetrics(journey.id);
            const hasProblems = metrics.delayed > 0 || metrics.atRisk > 0;
            
            return (
              <div
                key={journey.id}
                onClick={() => navigate(`/journey/${journey.id}`)}
                className={cn(
                  "bg-white border rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-xl group",
                  hasProblems ? "border-amber-200" : "border-gray-200"
                )}
              >
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getTypeIcon(journey.type)}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {journey.name}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {journey.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border",
                      getStatusColor(journey.status)
                    )}>
                      {journey.status === 'active' ? 'Active' : 
                       journey.status === 'draft' ? 'Draft' : 'Archived'}
                    </span>
                  </div>
                  
                  {journey.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{journey.description}</p>
                  )}

                  {/* Eligibility Criteria */}
                  {journey.eligibilityCriteria && journey.eligibilityCriteria.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {journey.eligibilityCriteria.map((criterion, idx) => (
                        <span 
                          key={criterion.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                        >
                          {getAttributeLabel(criterion.attribute)} {getOperatorLabel(criterion.operator)} {Array.isArray(criterion.value) ? criterion.value.join(', ') : criterion.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mini Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{metrics.totalEmployees}</span>
                      <span className="text-gray-400 text-xs">employees</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{metrics.averageDuration}d avg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{journey.periods.length} periods</span>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                {(() => {
                  const total = metrics.totalEmployees;
                  
                  return (
                    <div className="px-5 pb-5">
                      {/* Status breakdown bar - all employees */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-3">
                        {total > 0 && (
                          <>
                            <div 
                              className="bg-blue-500 transition-all"
                              style={{ width: `${(metrics.completed / total) * 100}%` }}
                              title={`Completed: ${metrics.completed}`}
                            />
                            <div 
                              className="bg-emerald-500 transition-all"
                              style={{ width: `${(metrics.onTrack / total) * 100}%` }}
                              title={`On track: ${metrics.onTrack}`}
                            />
                            <div 
                              className="bg-amber-500 transition-all"
                              style={{ width: `${(metrics.atRisk / total) * 100}%` }}
                              title={`At risk: ${metrics.atRisk}`}
                            />
                            <div 
                              className="bg-red-500 transition-all"
                              style={{ width: `${(metrics.delayed / total) * 100}%` }}
                              title={`Delayed: ${metrics.delayed}`}
                            />
                          </>
                        )}
                      </div>

                      {/* Status labels */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {metrics.completed > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-blue-600 font-medium">{metrics.completed} done</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-emerald-600 font-medium">{metrics.onTrack} on track</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {metrics.atRisk > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <AlertTriangle className="w-3 h-3" />
                              {metrics.atRisk} at risk
                            </span>
                          )}
                          {metrics.delayed > 0 && (
                            <span className="flex items-center gap-1 text-red-600 font-medium">
                              <Flame className="w-3 h-3" />
                              {metrics.delayed} delayed
                            </span>
                          )}
                          {metrics.atRisk === 0 && metrics.delayed === 0 && metrics.completed === 0 && (
                            <span className="text-gray-400">All on track ✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Hover CTA */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm text-gray-500">View details</span>
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
            );
          })}

          {/* Create New Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all min-h-[280px] group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Create new journey</h3>
            <p className="text-sm text-gray-500 text-center max-w-[200px]">
              Onboarding, offboarding, promotions or custom journeys
            </p>
          </div>
        </div>

        {/* Empty state */}
        {filteredJourneys.length === 0 && journeys.length > 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No journeys match this filter</h3>
            <p className="text-sm text-gray-500">Try changing the status filter</p>
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
