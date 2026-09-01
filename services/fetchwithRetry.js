// Wraps fetch with automatic retries for transient network failures
// (ECONNRESET, timeouts, etc). Exponential backoff between attempts.
async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      const isLastAttempt = attempt === retries;
      const isTransient =
        err.cause?.code === "ECONNRESET" ||
        err.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        err.cause?.code === "ETIMEDOUT";

      if (isLastAttempt || !isTransient) {
        throw err;
      }

      console.warn(`Fetch attempt ${attempt} failed (${err.cause?.code || err.message}), retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

module.exports = { fetchWithRetry };
