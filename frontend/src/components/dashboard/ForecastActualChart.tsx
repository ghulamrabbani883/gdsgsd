
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ComparisonPoint } from "../../types/dashboard";

interface Props {
  data: ComparisonPoint[];
}

export default function ForecastActualChart({ data }: Props) {
  const chartData = data.map((item) => {
    const date = new Date(item.start_time);

    return {
      timestamp: date.getTime(),
      dateLabel: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }),
      actual: item.actual_mw,
      forecast: item.forecast_mw,
    };
  });

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Wind generation: actual vs forecast</h3>
          <p>Hourly generation comparison · January 2026</p>
        </div>
        <span className="chart-unit">MW</span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
          >
            <CartesianGrid
              stroke="#263342"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  timeZone: "UTC",
                })
              }
              tickCount={8}
              minTickGap={35}
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 11 }}
            />

            <YAxis
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 11 }}
              tickFormatter={(value) =>
                `${(value / 1000).toFixed(0)}k`
              }
            />

            <Tooltip
              labelFormatter={(value) =>
                new Date(Number(value)).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                  timeZoneName: "short",
                })
              }
              contentStyle={{
                background: "#111c29",
                border: "1px solid #2a3a4c",
                borderRadius: 10,
                color: "#fff",
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString("en-GB", {
                  maximumFractionDigits: 2,
                })} MW`,
              ]}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="actual"
              name="Actual generation"
              stroke="#39c9a5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />

            <Line
              type="monotone"
              dataKey="forecast"
              name="Day-ahead forecast"
              stroke="#8b91ff"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
