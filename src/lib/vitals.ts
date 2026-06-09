import { Sentry } from "./sentry";
import type { Metric } from "web-vitals";

function reportMetric(metric: Metric) {
  if (import.meta.env.DEV) {
    console.debug(`[vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`);
  }
  Sentry.addBreadcrumb({
    category: "web-vitals",
    message: `${metric.name}: ${Math.round(metric.value)}`,
    data: { rating: metric.rating },
    level: "info",
  });
}

export function reportWebVitals() {
  import("web-vitals")
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportMetric);
      onFCP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
      onINP(reportMetric);
    })
    .catch(() => {});
}
