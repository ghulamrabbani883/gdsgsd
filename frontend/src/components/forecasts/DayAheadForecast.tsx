
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarDays, Clock, Wind } from "lucide-react";

import Loading from "../common/Loading";
import ErrorMessage from "../common/ErrorMessage";

import type {
  DayAheadForecastResponse,
} from "../../types/forecast";

interface Props {
  deliveryDate: string;
  onDateChange: (date: string) => void;
  data?: DayAheadForecastResponse;
  isLoading: boolean;
  error: unknown;
}

function formatUtc(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function getDecisionCutoff(deliveryDate: string) {
  const date = new Date(`${deliveryDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);

  const previousDay = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${previousDay} · 12:00 UK`;
}

export default function DayAheadForecast({
  deliveryDate,
  onDateChange,
  data,
  isLoading,
  error,
}: Props) {
  const forecastRows = (data?.data ?? [])
    .filter((item) => item.forecast_mw !== null)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() -
        new Date(b.start_time).getTime()
    );

  const chartData = forecastRows.map((item) => ({
    hour: new Date(item.start_time).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }),
    forecast: item.forecast_mw,
  }));

  const publicationTimes = [
    ...new Set(
      forecastRows.map((item) => item.publish_time)
    ),
  ].sort();

  const publicationLabel =
    publicationTimes.length === 1
      ? formatUtc(publicationTimes[0])
      : publicationTimes.length > 1
        ? `${publicationTimes.length} publication vintages`
        : "Publication information unavailable";

  const dateLabel = new Date(
    `${deliveryDate}T00:00:00Z`
  ).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="forecast-intelligence">
      <div className="forecast-intelligence-header">
        <div>
          <span className="eyebrow">
            DAY-AHEAD FORECAST INTELLIGENCE
          </span>
          <h2>Wind generation available for procurement planning</h2>
          <p>
            Decision-time forecast snapshot for the selected
            delivery date.
          </p>
        </div>

        <div className="datetime-control forecast-date-control">
          <label htmlFor="forecast-delivery-date">
            <CalendarDays size={13} />
            DELIVERY DATE
          </label>

          <input
            id="forecast-delivery-date"
            type="date"
            value={deliveryDate}
            min="2026-01-01"
            max="2026-01-31"
            onChange={(event) =>
              onDateChange(event.target.value)
            }
          />
        </div>
      </div>

      <div className="forecast-meta-grid">
        <div className="forecast-stat">
          <span>
            <CalendarDays size={14} />
            DELIVERY DATE
          </span>
          <strong>{dateLabel}</strong>
        </div>

        <div className="forecast-stat">
          <span>
            <Clock size={14} />
            DECISION CUTOFF
          </span>
          <strong>{getDecisionCutoff(deliveryDate)}</strong>
        </div>

        <div className="forecast-stat">
          <span>
            <Wind size={14} />
            FORECAST PERIODS
          </span>
          <strong>
            {isLoading ? "Loading..." : forecastRows.length}
            <small> / 24 hourly periods</small>
          </strong>
        </div>

        <div className="forecast-stat">
          <span>
            <Clock size={14} />
            PUBLICATION
          </span>
          <strong className="publication-value">
            {publicationLabel}
          </strong>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage
          message={
            error instanceof Error
              ? error.message
              : "Unable to retrieve the day-ahead forecast."
          }
        />
      ) : forecastRows.length === 0 ? (
        <div className="forecast-empty">
          No eligible forecast records were found for this
          delivery date.
        </div>
      ) : (
        <>
          <div className="forecast-chart-card">
            <div className="section-heading">
              <div>
                <h3>Hourly wind generation forecast</h3>
                <p>
                  Selected day-ahead forecast · UTC
                </p>
              </div>
              <span className="chart-unit">MW</span>
            </div>

            <div className="chart-area">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 12,
                    left: 4,
                    bottom: 4,
                  }}
                >
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
                        stopColor="#39c9a5"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="#39c9a5"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#263342"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="hour"
                    stroke="#8493a5"
                    tick={{ fill: "#8493a5", fontSize: 10 }}
                    interval={3}
                  />

                  <YAxis
                    stroke="#8493a5"
                    tick={{ fill: "#8493a5", fontSize: 11 }}
                    tickFormatter={(value) =>
                      `${(Number(value) / 1000).toFixed(0)}k`
                    }
                  />

                  <Tooltip
                    contentStyle={{
                      background: "#111c29",
                      border: "1px solid #2a3a4c",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      `${Number(value).toLocaleString("en-GB")} MW`,
                      "Forecast generation",
                    ]}
                    labelFormatter={(label) =>
                      `Delivery time: ${label} UTC`
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast generation"
                    stroke="#39c9a5"
                    strokeWidth={2.5}
                    fill="url(#forecastGradient)"
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="forecast-table-card">
            <div className="section-heading">
              <div>
                <h3>Hourly forecast schedule</h3>
                <p>
                  Forecast generation by delivery interval
                </p>
              </div>
              <span className="chart-unit">
                {forecastRows.length} RECORDS
              </span>
            </div>

            <div className="forecast-table-wrap">
              <table className="forecast-table">
                <thead>
                  <tr>
                    <th>DELIVERY TIME · UTC</th>
                    <th>FORECAST GENERATION</th>
                    <th>PUBLICATION TIME · UTC</th>
                  </tr>
                </thead>

                <tbody>
                  {forecastRows.map((item) => (
                    <tr key={item.start_time}>
                      <td>
                        {new Date(item.start_time).toLocaleTimeString(
                          "en-GB",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                            timeZone: "UTC",
                          }
                        )}
                      </td>

                      <td className="forecast-mw-cell">
                        {Number(item.forecast_mw).toLocaleString(
                          "en-GB",
                          {
                            maximumFractionDigits: 2,
                          }
                        )}{" "}
                        MW
                      </td>

                      <td>{formatUtc(item.publish_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <div className="forecast-assumption">
        <strong>Decision methodology:</strong> For each delivery
        interval, the selected forecast is the latest available
        publication at or before the previous-day 12:00 UK cutoff.
        This cutoff is an illustrative project assumption, not a
        representation of an official market deadline.
      </div>
    </div>
  );
}
