
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ForecastEvolutionPoint } from "../../types/analytics";

interface Props {
  data: ForecastEvolutionPoint[];
}

export default function ForecastEvolutionChart({ data }: Props) {
  const chartData = data.map((item) => ({
    publication: new Date(item.publish_time).toISOString().slice(0, 16).replace("T", " "),
    generation: item.generation_mw,
  }));

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Forecast evolution</h3>
          <p>Forecast revisions for the selected delivery interval</p>
        </div>
        <span className="chart-unit">MW</span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="forecastGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#8b91ff"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="#8b91ff"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="#263342"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="publication"
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 9 }}
              interval="preserveStartEnd"
            />

            <YAxis
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 11 }}
            />

            <Tooltip
              contentStyle={{
                background: "#111c29",
                border: "1px solid #2a3a4c",
                borderRadius: 10,
              }}
              formatter={(value) => [
                `${Number(value).toLocaleString("en-GB")} MW`,
              ]}
            />

            <Area
              type="monotone"
              dataKey="generation"
              name="Forecast"
              stroke="#8b91ff"
              fill="url(#forecastGradient)"
              strokeWidth={2}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
