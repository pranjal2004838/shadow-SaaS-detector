const scanButton = document.getElementById('scan-btn');
const statusEl = document.getElementById('status');

function setStatus(message, kind = '') {
  statusEl.textContent = message;
  statusEl.className = kind;
}

function extractHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

scanButton.addEventListener('click', () => {
  scanButton.disabled = true;
  setStatus('Scanning history…');

  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  chrome.history.search(
    {
      text: '',
      startTime: ninetyDaysAgo,
      maxResults: 10000,
    },
    async (items) => {
      try {
        const domains = Array.from(
          new Set(
            items
              .map((item) => extractHostname(item.url || ''))
              .filter(Boolean)
          )
        );

        if (domains.length === 0) {
          setStatus('No domains found in history for the last 90 days.', 'error');
          scanButton.disabled = false;
          return;
        }

        const response = await fetch('http://localhost:5000/api/browser-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domains }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || `Backend request failed (${response.status})`);
        }

        const data = await response.json();
        setStatus(`Success: detected ${data.detectedCount ?? 0} apps from ${domains.length} unique domains.`, 'ok');
      } catch (error) {
        setStatus(`Error: ${error instanceof Error ? error.message : 'Could not complete scan.'}`, 'error');
      } finally {
        scanButton.disabled = false;
      }
    }
  );
});
