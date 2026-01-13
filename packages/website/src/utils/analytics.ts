import { actions, getActionPath } from 'astro:actions';
import { onLCP } from 'web-vitals';

onLCP(async (event) => {
  type CollectMetricsParams = Parameters<typeof actions.collectMetrics>;
  const actionUrl = getActionPath(actions.collectMetrics);
  const commitSha = import.meta.env.COMMIT_SHA;
  const input: CollectMetricsParams[0] = { lcp: event.value, commitSha };
  const body = JSON.stringify(input);
  navigator.sendBeacon(actionUrl, new Blob([body], { type: 'application/json' }));
});
