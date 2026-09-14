import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

const reportWebVitals = (onPerfEntry?: (metric: unknown) => void): void => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS((metric) => onPerfEntry(metric));
    onINP((metric) => onPerfEntry(metric));
    onFCP((metric) => onPerfEntry(metric));
    onLCP((metric) => onPerfEntry(metric));
    onTTFB((metric) => onPerfEntry(metric));
  }
};

export default reportWebVitals;
