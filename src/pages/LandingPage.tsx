import { useNavigate } from 'react-router-dom';
import { GitBranch, Activity, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Journeys Builder',
      description: 'Create and configure employee lifecycle journeys with visual timeline and tree views.',
      icon: <GitBranch className="w-8 h-8" />,
      path: '/builder',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Journeys Monitor',
      description: 'Track employee progress, identify bottlenecks, and monitor journey health metrics.',
      icon: <Activity className="w-8 h-8" />,
      path: '/monitor',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Employee Life Cycle Journeys</h1>
        <p className="text-muted-foreground text-lg">
          Build, manage, and monitor employee journeys at scale
        </p>
      </header>

      {/* Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        {cards.map((card) => (
          <button
            key={card.path}
            onClick={() => navigate(card.path)}
            className="factorial-card p-8 text-left group transition-all hover:shadow-factorial-md"
          >
            <div className={`${card.bgColor} ${card.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6`}>
              {card.icon}
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
              {card.title}
              <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </h2>
            
            <p className="text-muted-foreground">
              {card.description}
            </p>
          </button>
        ))}
      </div>

      {/* Quick stats */}
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
        <div className="factorial-card p-6">
          <p className="text-3xl font-bold text-foreground">1</p>
          <p className="text-sm text-muted-foreground">Active Journeys</p>
        </div>
        <div className="factorial-card p-6">
          <p className="text-3xl font-bold text-foreground">150</p>
          <p className="text-sm text-muted-foreground">Employees</p>
        </div>
        <div className="factorial-card p-6">
          <p className="text-3xl font-bold text-success">78%</p>
          <p className="text-sm text-muted-foreground">On Track</p>
        </div>
        <div className="factorial-card p-6">
          <p className="text-3xl font-bold text-warning">12%</p>
          <p className="text-sm text-muted-foreground">At Risk</p>
        </div>
      </div>
    </div>
  );
}
