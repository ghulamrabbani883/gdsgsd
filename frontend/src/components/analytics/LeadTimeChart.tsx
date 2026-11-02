
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LeadTimeAccuracy } from "../../types/analytics";

interface Props {
  data: LeadTimeAccuracy[];
}

export default function LeadTimeChart({ data }: Props) {
  const chartData = data.map((item) => ({
    ...item,
    mae_mw: Number(item.mae_mw),
  }));

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Forecast accuracy by lead time</h3>
          <p>How error changes as delivery approaches</p>
        </div>
        <span className="chart-unit">MAE · MW</span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid
              stroke="#263342"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="lead_time_bucket"
              type="category"
              interval={0}
              angle={-25}
              textAnchor="end"
              height={65}
              tickMargin={12}
              minTickGap={0}
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 10 }}
            />

            <YAxis
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 11 }}
              tickFormatter={(value) =>
                `${(Number(value) / 1000).toFixed(1)}k`
              }
            />

            <Tooltip
              contentStyle={{
                background: "#111c29",
                border: "1px solid #2a3a4c",
                borderRadius: 10,
                color: "#fff",
              }}
              formatter={(value, name) => [
                `${Number(value).toLocaleString("en-GB", {
                  maximumFractionDigits: 2,
                })} MW`,
                name === "mae_mw" ? "Mean absolute error" : String(name),
              ]}
              labelFormatter={(label) => `Lead time: ${label}`}
            />

            <Line
              type="monotone"
              dataKey="mae_mw"
              name="MAE"
              stroke="#a69bff"
              strokeWidth={3}
              dot={{ r: 4, fill: "#a69bff" }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
