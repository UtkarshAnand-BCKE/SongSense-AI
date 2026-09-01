async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Return immediately for successful responses
      if (response.ok) {
        return response;
      }

      // Retry server-side errors
      if (response.status >= 500 && attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("Request failed after multiple retries.");
}

module.exports = {
  fetchWithRetry
};