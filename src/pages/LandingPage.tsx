import { useNavigate } from 'react-router-dom';
import { useJourneyStore } from '@/stores/journeyStore';
import { useMemo } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Users, 
  TrendingUp, 
  Clock, 
  Zap,
  CheckCircle2,
  GitBranch,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { journeys, getJourneyMetrics, employeeProgress } = useJourneyStore();

  // Calculate global stats
  const globalStats = useMemo(() => {
    let totalEmployees = 0;
    let onTrack = 0;
    let completed = 0;
    let atRisk = 0;
    let delayed = 0;

    journeys.forEach(journey => {
      const metrics = getJourneyMetrics(journey.id);
      totalEmployees += metrics.totalEmployees;
      onTrack += metrics.onTrack;
      completed += metrics.completed;
      atRisk += metrics.atRisk;
      delayed += metrics.delayed;
    });

    const completionRate = totalEmployees > 0 
      ? Math.round((completed / totalEmployees) * 100) 
      : 0;

    return {
      totalJourneys: journeys.length,
      activeJourneys: journeys.filter(j => j.status === 'active').length,
      totalEmployees,
      onTrack,
      completed,
      atRisk,
      delayed,
      completionRate
    };
  }, [journeys, getJourneyMetrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-red-200/30 to-orange-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-200/20 to-cyan-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 via-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">JourneyFlow</h1>
              <p className="text-sm text-gray-500">Employee Lifecycle</p>
            </div>
          </div>

          {/* Main Headline */}
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Design. Build. Monitor.
            <br />
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Employee Journeys
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Create seamless onboarding, offboarding, and lifecycle experiences. 
            Track progress in real-time and ensure no employee falls behind.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/workflows')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105 transition-all duration-300"
          >
            Go to Journeys
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
              <GitBranch className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{globalStats.activeJourneys}</p>
            <p className="text-sm text-gray-500">Active Journeys</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{globalStats.totalEmployees}</p>
            <p className="text-sm text-gray-500">Total Employees</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">{globalStats.onTrack}</p>
            <p className="text-sm text-gray-500">On Track</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{globalStats.completionRate}%</p>
            <p className="text-sm text-gray-500">Completion Rate</p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div 
            onClick={() => navigate('/workflows')}
            className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-red-200 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Build Journeys
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-600">
              Create visual workflows with blocks, tasks, and conditional logic. Design onboarding, offboarding, and custom journeys.
            </p>
          </div>

          <div 
            onClick={() => navigate('/workflows')}
            className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Monitor Progress
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-600">
              Track every employee's journey in real-time. Identify bottlenecks, at-risk employees, and optimize your processes.
            </p>
          </div>

          <div 
            onClick={() => navigate('/workflows')}
            className="group bg-white rounded-2xl p-8 border border-gray-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              Automate Tasks
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-gray-600">
              Set up time-based triggers and audience rules. Automatically assign tasks based on employee attributes.
            </p>
          </div>
        </div>

        {/* Recent Journeys Preview */}
        {journeys.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Your Journeys</h3>
              <button
                onClick={() => navigate('/workflows')}
                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-3">
              {journeys.slice(0, 3).map(journey => {
                const metrics = getJourneyMetrics(journey.id);
                return (
                  <div 
                    key={journey.id}
                    onClick={() => navigate(`/journey/${journey.id}`)}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {journey.type === 'onboarding' ? '🚀' : 
                         journey.type === 'offboarding' ? '👋' : 
                         journey.type === 'promotion' ? '⭐' : '📋'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{journey.name}</p>
                        <p className="text-sm text-gray-500">{metrics.totalEmployees} employees</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-600">{metrics.onTrack} on track</p>
                        {metrics.atRisk > 0 && (
                          <p className="text-xs text-amber-600">{metrics.atRisk} at risk</p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            JourneyFlow Pro • Employee Lifecycle Management
          </p>
        </div>
      </div>
    </div>
  );
}
