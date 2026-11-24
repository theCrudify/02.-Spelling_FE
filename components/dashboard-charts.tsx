"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type TrendPoint = { month: string; uploaded: number; approved: number };

/**
 * Monthly artwork uploads vs approved labels. Two series on one count axis; colours are the validated categorical
 * slots 1-2 (--series-1 / --series-2 in globals.css, with their own dark steps). Legend + tooltip + a table for
 * screen readers, so identity never depends on colour alone.
 */
export function TrendChart({ data, labels }: { data: TrendPoint[]; labels: { uploaded: string; approved: string; month: string } }) {
  return (
    <figure>
      <div className="h-64" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--color-line)" strokeDasharray="0" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "var(--color-line-2)" }} tick={{ fill: "var(--color-ink-3)", fontSize: 11 }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--color-ink-3)", fontSize: 11 }} />
            <Tooltip
              cursor={{ stroke: "var(--color-line-2)" }}
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-line)", borderRadius: 8, fontSize: 12, color: "var(--color-ink)" }}
              labelStyle={{ color: "var(--color-ink-3)", marginBottom: 2 }}
              itemStyle={{ color: "var(--color-ink)" }}
            />
            <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: "var(--color-ink-2)" }} formatter={(v) => <span style={{ color: "var(--color-ink-2)" }}>{v}</span>} />
            <Line type="monotone" dataKey="uploaded" name={labels.uploaded} stroke="var(--series-1)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)", fill: "var(--series-1)" }} activeDot={{ r: 5 }} isAnimationActive={false} />
            <Line type="monotone" dataKey="approved" name={labels.approved} stroke="var(--series-2)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: "var(--color-surface)", fill: "var(--series-2)" }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <thead>
          <tr><th>{labels.month}</th><th>{labels.uploaded}</th><th>{labels.approved}</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}><td>{d.month}</td><td>{d.uploaded}</td><td>{d.approved}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
