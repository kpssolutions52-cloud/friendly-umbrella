'use client';

import { CheckCircle2, AlertCircle, Info, TrendingUp, Users, Zap, Target, DollarSign, Clock } from 'lucide-react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'info';
}

export function Badge({ children, variant = 'primary' }: BadgeProps) {
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variants[variant]}`}>
      {children}
    </span>
  );
}

interface CalloutProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Info,
      iconColor: 'text-blue-600',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 rounded-r-lg my-6`}>
      <div className="flex items-start">
        <Icon className={`h-5 w-5 ${style.iconColor} mr-3 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          {title && <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>}
          <div className="text-gray-700">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

export function MetricCard({ icon, label, value, trend }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-gray-500 text-sm font-medium">{label}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`text-xs mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '↑' : '↓'} Trending {trend}
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

export function FeatureCard({ icon, title, description, highlight }: FeatureCardProps) {
  return (
    <div className={`border rounded-xl p-6 ${highlight ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-md' : 'bg-white border-gray-200 hover:shadow-md'} transition-all`}>
      <div className="flex items-start">
        <div className={`p-3 rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-100'} mr-4`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

interface ComparisonTableProps {
  data: {
    feature: string;
    old: string | React.ReactNode;
    new: string | React.ReactNode;
  }[];
}

export function ComparisonTable({ data }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Feature</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Before</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">After</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{row.feature}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{row.old}</td>
              <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.new}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TimelineItemProps {
  phase: string;
  title: string;
  description: string;
  duration: string;
  status?: 'completed' | 'current' | 'upcoming';
}

export function TimelineItem({ phase, title, description, duration, status = 'upcoming' }: TimelineItemProps) {
  const statusStyles = {
    completed: 'bg-green-100 border-green-300 text-green-800',
    current: 'bg-blue-100 border-blue-300 text-blue-800',
    upcoming: 'bg-gray-100 border-gray-300 text-gray-600',
  };

  return (
    <div className={`border-l-4 ${status === 'completed' ? 'border-green-500' : status === 'current' ? 'border-blue-500' : 'border-gray-300'} pl-6 py-4 mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant={status === 'completed' ? 'success' : status === 'current' ? 'primary' : 'info'}>
              {phase}
            </Badge>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${statusStyles[status]}`}>
              {status === 'completed' ? '✓ Completed' : status === 'current' ? '→ Current' : '○ Upcoming'}
            </span>
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm mb-2">{description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  subtitle?: string;
}

export function StatCard({ icon, value, label, subtitle }: StatCardProps) {
  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="text-gray-600 text-sm font-medium">{label}</div>
        <div className="text-blue-600">{icon}</div>
      </div>
      <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}
