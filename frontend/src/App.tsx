import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Target,
  TrendingUp,
  Wind,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import AppLayout from "./components/layout/AppLayout";
import Header from "./components/layout/Header";
import KpiCard from "./components/dashboard/KpiCard";
import ForecastActualChart from "./components/dashboard/ForecastActualChart";
import DailyAccuracyChart from "./components/analytics/DailyAccuracyChart";
import LeadTimeChart from "./components/analytics/LeadTimeChart";
import ForecastEvolutionChart from "./components/forecasts/ForecastEvolutionChart";
import DayAheadForecast from "./components/forecasts/DayAheadForecast";
import Loading from "./components/common/Loading";
import ErrorMessage from "./components/common/ErrorMessage";

import { useDashboard } from "./hooks/useDashboard";
import {
  useAnalytics,
  useForecastEvolution,
} from "./hooks/useAnalytics";
import { useDayAheadForecast } from "./hooks/useDayAheadForecast";

import { formatNumber, formatMW } from "./utils/formatters";

export default function App() {
  const queryClient = useQueryClient();

  const [deliveryTime, setDeliveryTime] = useState(
    "2026-01-01T10:00"
  );
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(
    "2026-01-01"
  );

  // The datetime-local value is deliberately interpreted as UTC.
  const deliveryTimeUtc = `${deliveryTime}:00Z`;

  const dashboard = useDashboard();
  const analytics = useAnalytics();
  const evolution = useForecastEvolution(deliveryTimeUtc);
  const dayAhead = useDayAheadForecast(selectedDeliveryDate);

  const isLoading =
    dashboard.isLoading || analytics.isLoading || evolution.isLoading;

  const error = dashboard.error || analytics.error;

  const refreshDashboard = async () => {
    await queryClient.invalidateQueries();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }

  if (error || !dashboard.data || !analytics.data) {
    return (
      <AppLayout>
        <ErrorMessage
          message={
            error instanceof Error
              ? error.message
              : "Could not connect to the Elexon backend."
          }
        />
      </AppLayout>
    );
  }

  const summary = dashboard.data.summary;
  const report = analytics.data;
  const coverage = summary.coverage_percentage ?? 0;
  const bias = summary.bias_mw ?? 0;

  const rankedLeadTimes = report.lead_time_accuracy
    .filter(
      (item) =>
        item.mae_mw !== null &&
        Number.isFinite(Number(item.mae_mw))
    )
    .slice()
    .sort((a, b) => Number(a.mae_mw) - Number(b.mae_mw));

  const bestLeadTime = rankedLeadTimes[0];
  const worstLeadTime = rankedLeadTimes[rankedLeadTimes.length - 1];

  const totalLeadTimeObservations = report.lead_time_accuracy.reduce(
    (total, item) => total + item.forecast_observations,
    0
  );

  return (
    <AppLayout>
      <div className="dashboard-page" id="overview">
        <Header
          period="January 2026"
          onRefresh={refreshDashboard}
          isRefreshing={
            dashboard.isFetching ||
            analytics.isFetching ||
            evolution.isFetching ||
            dayAhead.isFetching
          }
        />

        {/* Decision-facing forecast information appears before accuracy analytics. */}
        <DayAheadForecast
          deliveryDate={selectedDeliveryDate}
          onDateChange={setSelectedDeliveryDate}
          data={dayAhead.data}
          isLoading={dayAhead.isLoading}
          error={dayAhead.error}
        />

        <section className="insight-banner">
          <div className="insight-icon">
            <Activity size={21} />
          </div>

          <div className="insight-copy">
            <strong>January performance insight</strong>
            <p>
              Wind forecasts show an average absolute error of{" "}
              <b>{formatMW(summary.mae_mw)}</b>, with an average
              {bias >= 0 ? " overforecast" : " underforecast"} bias of{" "}
              <b>{formatMW(Math.abs(bias))}</b>.
            </p>
          </div>

          <span className="insight-period">01 JAN — 31 JAN 2026</span>
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">PERFORMANCE SNAPSHOT</span>
              <h2>Key performance indicators</h2>
            </div>

            <span className="data-badge">
              <CheckCircle2 size={14} />
              Live API data
            </span>
          </div>

          <div className="kpi-grid">
            <KpiCard
              title="Forecast MAE"
              value={formatNumber(summary.mae_mw)}
              subtitle="Mean absolute error · MW"
              icon={Target}
              accent="accent-green"
            />

            <KpiCard
              title="Forecast RMSE"
              value={formatNumber(summary.rmse_mw)}
              subtitle="Root mean squared error · MW"
              icon={Gauge}
              accent="accent-purple"
            />

            <KpiCard
              title="Forecast bias"
              value={`${bias > 0 ? "+" : ""}${formatNumber(bias)}`}
              subtitle={
                bias > 0
                  ? "Average overforecast · MW"
                  : bias < 0
                    ? "Average underforecast · MW"
                    : "No average directional bias"
              }
              icon={TrendingUp}
              accent="accent-orange"
            />

            <KpiCard
              title="MAPE"
              value={`${formatNumber(summary.mape_percentage)}%`}
              subtitle="Mean absolute percentage error"
              icon={Activity}
              accent="accent-blue"
            />
          </div>
        </section>

        <section className="section-block" id="generation">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">GENERATION MONITORING</span>
              <h2>Actual vs forecast generation</h2>
            </div>

            <span className="unit-label">MEGAWATTS · MW</span>
          </div>

          <ForecastActualChart data={report.comparison} />
        </section>

        <section className="section-block" id="analytics">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">ACCURACY ANALYSIS</span>
              <h2>Forecast performance trends</h2>
            </div>
          </div>

          <div className="chart-grid">
            <DailyAccuracyChart data={report.daily_accuracy} />
            <LeadTimeChart data={report.lead_time_accuracy} />
          </div>
        </section>

        <section className="section-block">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">ANALYTICAL INSIGHTS</span>
              <h2>Lead-time performance insights</h2>
            </div>
          </div>

          {bestLeadTime && worstLeadTime ? (
            <div className="quality-grid">
              <div className="quality-card">
                <div className="quality-icon green">
                  <ArrowDownRight size={19} />
                </div>
                <span>Lowest forecast error</span>
                <strong>{bestLeadTime.lead_time_bucket}</strong>
                <small>MAE: {formatMW(bestLeadTime.mae_mw)}</small>
              </div>

              <div className="quality-card">
                <div className="quality-icon orange">
                  <ArrowUpRight size={19} />
                </div>
                <span>Highest forecast error</span>
                <strong>{worstLeadTime.lead_time_bucket}</strong>
                <small>MAE: {formatMW(worstLeadTime.mae_mw)}</small>
              </div>

              <div className="quality-card">
                <div className="quality-icon purple">
                  <Clock size={19} />
                </div>
                <span>Lead-time observations</span>
                <strong>{formatNumber(totalLeadTimeObservations, 0)}</strong>
                <small>Forecast-vintage / actual pairs</small>
              </div>
            </div>
          ) : (
            <p>No lead-time insight data is currently available.</p>
          )}
        </section>

        <section className="section-block" id="evolution">
          <div className="section-title-row evolution-heading">
            <div>
              <span className="eyebrow">FORECAST VINTAGES</span>
              <h2>Forecast evolution</h2>
              <p>
                Track revisions published before the selected delivery
                interval.
              </p>
            </div>

            <div className="datetime-control">
              <label htmlFor="delivery-time">DELIVERY TIME · UTC</label>
              <input
                id="delivery-time"
                type="datetime-local"
                value={deliveryTime}
                min="2026-01-01T00:00"
                max="2026-01-31T23:00"
                onChange={(event) => setDeliveryTime(event.target.value)}
              />
              <small>
                Entered values are interpreted as UTC, not browser local time.
              </small>
            </div>
          </div>

          {evolution.isLoading ? (
            <Loading />
          ) : evolution.error ? (
            <ErrorMessage message="Unable to load forecast evolution." />
          ) : evolution.data ? (
            <>
              <div className="evolution-meta">
                <span>
                  <Wind size={15} />
                  {evolution.data.count} eligible forecast vintages
                </span>

                <span>
                  Delivery: {formatUtcDateTime(evolution.data.delivery_time)}
                </span>
              </div>

              <ForecastEvolutionChart data={evolution.data.data} />
            </>
          ) : null}
        </section>

        <section className="section-block" id="quality">
          <div className="section-title-row">
            <div>
              <span className="eyebrow">DATA QUALITY</span>
              <h2>Dataset coverage and integrity</h2>
            </div>
          </div>

          <div className="quality-grid">
            <div className="quality-card">
              <div className="quality-icon green">
                <DatabaseIcon />
              </div>
              <span>Hourly actual periods</span>
              <strong>
                {formatNumber(summary.actual_hourly_periods, 0)}
              </strong>
              <small>Expected: 744</small>
            </div>

            <div className="quality-card">
              <div className="quality-icon blue">
                <Wind size={19} />
              </div>
              <span>Selected forecast periods</span>
              <strong>{formatNumber(summary.forecast_periods, 0)}</strong>
              <small>Day-ahead snapshot</small>
            </div>

            <div className="quality-card">
              <div className="quality-icon purple">
                <CheckCircle2 size={19} />
              </div>
              <span>Matched periods</span>
              <strong>{formatNumber(summary.matched_periods, 0)}</strong>
              <small>{formatNumber(coverage)}% coverage</small>
            </div>

            <div className="quality-card">
              <div className="quality-icon orange">
                {coverage === 100 ? (
                  <CheckCircle2 size={19} />
                ) : (
                  <AlertTriangle size={19} />
                )}
              </div>
              <span>Missing periods</span>
              <strong>
                {summary.missing_actual_periods +
                  summary.missing_forecast_periods}
              </strong>
              <small>Across matched datasets</small>
            </div>
          </div>

          <div className="coverage-card">
            <div className="coverage-header">
              <div>
                <strong>Data coverage</strong>
                <p>Matched forecast and actual delivery intervals</p>
              </div>
              <strong>{formatNumber(coverage)}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-value"
                style={{ width: `${Math.min(100, coverage)}%` }}
              />
            </div>
          </div>
        </section>

        <footer className="dashboard-footer">
          <div>
            <span className="footer-dot" />
            Connected to Elexon BMRS data
          </div>
          <span>
            Forecast decision cutoff: previous day, 12:00 UK (illustrative
            assumption)
          </span>
        </footer>
      </div>
    </AppLayout>
  );
}

function DatabaseIcon() {
  return <Activity size={19} />;
}

function formatUtcDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}
