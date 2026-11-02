
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyAccuracy } from "../../types/analytics";

interface Props {
  data: DailyAccuracy[];
}

export default function DailyAccuracyChart({ data }: Props) {
  const chartData = data.map((item) => ({
    date: item.delivery_date.slice(5),
    mae: item.mae_mw,
    rmse: item.rmse_mw,
  }));

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Daily forecast error</h3>
          <p>Mean absolute error by delivery date</p>
        </div>
        <span className="chart-unit">MW</span>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid
              stroke="#263342"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              stroke="#8493a5"
              tick={{ fill: "#8493a5", fontSize: 10 }}
              interval={3}
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

            <Bar
              dataKey="mae"
              name="MAE"
              fill="#39c9a5"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
