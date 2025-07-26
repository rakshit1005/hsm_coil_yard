import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Coil {
  coil_id: string;
  location: string;
  timestamp: string;
  status: 'coil_yard' | 'dispatched';
  weight?: number;
}

interface StatsCardsProps {
  coils: Coil[];
}

const StatsCards = ({ coils }: StatsCardsProps) => {
  const coilYardCount = coils.filter(c => c.status === 'coil_yard').length;
  const dispatchedCount = coils.filter(c => c.status === 'dispatched').length;
  const totalWeight = coils.reduce((sum, coil) => sum + (coil.weight || 0), 0);

  const stats = [
    {
      title: 'Coils in Yard',
      value: coilYardCount,
      icon: '🏭',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
    },
    {
      title: 'Dispatched',
      value: dispatchedCount,
      icon: '✅',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/50',
    },
    {
      title: 'Total Coils',
      value: coils.length,
      icon: '🔢',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
    },
    {
      title: 'Total Weight',
      value: `${totalWeight.toFixed(1)}T`,
      icon: '⚖️',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className={`bg-slate-800 border-slate-700 ${stat.borderColor} transition-all duration-200 hover:scale-105`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">
              {stat.title}
            </CardTitle>
            <div className={`text-2xl ${stat.bgColor} p-2 rounded-lg`}>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <p className="text-xs text-slate-500 mt-1">Live monitoring</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsCards;
