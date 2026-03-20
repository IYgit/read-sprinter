import { useState, useEffect } from 'react';
import { getExerciseResults, type ExerciseResult } from '@/lib/exerciseStats';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';

interface ExerciseStatsChartProps {
  exerciseId: string;
  title: string;
}

const ExerciseStatsChart = ({ exerciseId, title }: ExerciseStatsChartProps) => {
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    getExerciseResults(exerciseId)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="glass-card p-6 mt-6">
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-muted-foreground">{t('stats.loading')}</p>
      </div>
    );
  }

  if (results.length < 2) {
    return (
      <div className="glass-card p-6 mt-6">
        <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {t('stats.minResults', { current: results.length })}
        </p>
      </div>
    );
  }

  const chartData = results.map((r, i) => ({
    name: `${i + 1}`,
    score: r.score,
  }));

  const maxScore = Math.max(...results.map(r => r.score));
  const minScore = Math.min(...results.map(r => r.score));
  const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);

  return (
    <div className="glass-card p-6 mt-6">
      <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              domain={[Math.max(0, minScore - 50), maxScore + 50]}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              labelFormatter={(v) => t('stats.attempt', { n: v })}
              formatter={(value: number) => [t('stats.points', { value }), t('stats.resultLabel')]}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--accent))', r: 4 }}
              activeDot={{ r: 6, fill: 'hsl(var(--accent))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
        <div>
          <p className="text-lg font-bold text-foreground">{results.length}</p>
          <p className="text-xs text-muted-foreground">{t('stats.totalRuns')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-primary">{maxScore}</p>
          <p className="text-xs text-muted-foreground">{t('stats.maxScore')}</p>
        </div>
        <div>
          <p className="text-lg font-bold text-accent">{avgScore}</p>
          <p className="text-xs text-muted-foreground">{t('stats.avgScore')}</p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseStatsChart;
