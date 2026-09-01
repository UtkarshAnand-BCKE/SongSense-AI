const messageEl      = document.getElementById('message');
const charCountEl    = document.getElementById('charCount');
const recommendBtn   = document.getElementById('recommendBtn');
const gpsBtn         = document.getElementById('gpsBtn');
const cityBtn        = document.getElementById('cityBtn');
const cityInput      = document.getElementById('cityInput');
const locationBadge  = document.getElementById('locationStatus');
const locationText   = document.getElementById('locationText');
const statusMsg      = document.getElementById('statusMsg');

const nowPlayingCard   = document.getElementById('nowPlayingCard');
const npEmpty            = nowPlayingCard.querySelector('.np-empty');
const npLoaded            = nowPlayingCard.querySelector('.np-loaded');
const songTitle         = document.getElementById('songTitle');
const songArtist        = document.getElementById('songArtist');
const intentTag         = document.getElementById('intentTag');
const moodTag            = document.getElementById('moodTag');
const waveform            = nowPlayingCard.querySelector('.waveform');
const transportControls  = nowPlayingCard.querySelector('.transport');
const spotifyLink       = document.getElementById('spotifyLink');
const spotifySearchBtn  = document.getElementById('spotifySearchBtn');
const mediaWrap           = document.getElementById('spotifyEmbedWrap');

const weatherCard = document.getElementById('weatherCard');
const wcEmpty     = weatherCard.querySelector('.wc-empty');
const wcLoaded    = weatherCard.querySelector('.wc-loaded');
const weatherIcon = document.getElementById('weatherIcon');
const weatherCity = document.getElementById('weatherCity');
const weatherDesc = document.getElementById('weatherDesc');
const weatherTemp = document.getElementById('weatherTemp');

const chips = document.querySelectorAll('.chip');

let coords    = null;
let isPlaying = false;

// Character counter
messageEl.addEventListener('input', () => {
  charCountEl.textContent = messageEl.value.length;
  updateRecommendBtn();
});

// Quick-pick chips
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('chip-active'));
    chip.classList.add('chip-active');
    messageEl.value = chip.dataset.text;
    charCountEl.textContent = messageEl.value.length;
    updateRecommendBtn();
    messageEl.focus();
  });
});

// GPS
gpsBtn.addEventListener('click', () => {
  setStatus('Requesting location…', '');
  navigator.geolocation.getCurrentPosition(
    pos => {
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocationBadge(`${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
      updateRecommendBtn();
      setStatus('Location ready ✓', 'success');
    },
    () => setStatus('Location access denied. Try entering a city name.', 'error')
  );
});

// City lookup
cityBtn.addEventListener('click', () => lookupCity());
cityInput.addEventListener('keydown', e => { if (e.key === 'Enter') lookupCity(); });

async function lookupCity() {
  const city = cityInput.value.trim();
  if (!city) return;
  setStatus(`Looking up "${city}"…`, '');
  try {
    const res = await fetch(`/api/geocode?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('City not found');
    const data = await res.json();
    coords = { latitude: data.lat, longitude: data.lon };
    setLocationBadge(data.name || city);
    updateRecommendBtn();
    setStatus(`Using location: ${data.name || city} ✓`, 'success');
  } catch {
    setStatus(`Could not find "${city}". Try GPS instead.`, 'error');
  }
}

function updateRecommendBtn() {
  recommendBtn.disabled = !(messageEl.value.trim().length > 0 && coords !== null);
}

// Main recommend
recommendBtn.addEventListener('click', async () => {
  const message = messageEl.value.trim();
  if (!message || !coords) return;

  recommendBtn.classList.add('loading');
  recommendBtn.disabled = true;
  setStatus('Analysing your vibe…', '');

  try {
    const res = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, latitude: coords.latitude, longitude: coords.longitude }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Server error'); }
    const data = await res.json();
    renderResult(data);
    setStatus('✓ Recommendation ready', 'success');
  } catch (err) {
    setStatus(err.message || 'Something went wrong. Try again.', 'error');
  } finally {
    recommendBtn.classList.remove('loading');
    recommendBtn.disabled = false;
  }
});

function renderResult(data) {
  const { song, intent, weather, media } = data;

  songTitle.textContent  = song.title;
  songArtist.textContent = song.artist;
  intentTag.textContent  = formatIntent(intent);
  moodTag.textContent    = song.mood?.[0] ?? 'mixed';

  const fallbackUrl = `https://open.spotify.com/search/${encodeURIComponent(`${song.title} ${song.artist}`)}`;
  const openUrl = media?.watchUrl || fallbackUrl;
  spotifyLink.href = openUrl;
  spotifyLink.textContent = media?.watchUrl ? 'Open on YouTube' : 'Open in Spotify';
  spotifySearchBtn.onclick = () => window.open(openUrl, '_blank');

  npEmpty.hidden = true;
  npLoaded.hidden = false;
  nowPlayingCard.classList.remove('state-empty');
  nowPlayingCard.classList.add('state-loaded', 'fade-in');

  if (media?.embedUrl) {
    // Real playback: swap the fake waveform/transport controls for an
    // embedded YouTube player streaming the actual track.
    waveform.hidden = true;
    transportControls.hidden = true;
    mediaWrap.hidden = false;
    mediaWrap.innerHTML = `
      <iframe
        width="100%"
        height="200"
        src="${media.embedUrl}"
        title="${media.videoTitle || song.title}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>`;
  } else {
    // No match found (or API key not configured) — fall back to the
    // decorative waveform plus a link out to search for the track.
    mediaWrap.hidden = true;
    mediaWrap.innerHTML = '';
    waveform.hidden = false;
    transportControls.hidden = false;
    waveform.classList.remove('paused');
    isPlaying = true;
  }

  if (weather) {
    weatherIcon.textContent = conditionEmoji(weather.condition);
    weatherCity.textContent = weather.city;
    weatherDesc.textContent = weather.description;
    weatherTemp.textContent = `${Math.round(weather.temperature)}°C`;
    wcEmpty.hidden = true;
    wcLoaded.hidden = false;
    weatherCard.classList.remove('state-empty');
    weatherCard.classList.add('state-loaded', 'fade-in');
  }
}

// Play/pause (only used for the decorative fallback state, when there's
// no real embed to control)
const playBtn = nowPlayingCard.querySelector('.transport-play');
playBtn.addEventListener('click', () => {
  isPlaying = !isPlaying;
  waveform.classList.toggle('paused', !isPlaying);
  playBtn.innerHTML = isPlaying
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>`;
});

function setLocationBadge(text) {
  locationText.textContent = text;
  locationBadge.classList.add('has-loc');
}
function setStatus(msg, type = '') {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg';
  if (type) statusMsg.classList.add(`status-${type}`);
}
function formatIntent(raw) { return raw.replace(/_/g, ' '); }
function conditionEmoji(condition) {
  const c = (condition || '').toLowerCase();
  if (c.includes('clear') || c.includes('sun'))      return '☀️';
  if (c.includes('cloud'))                            return '⛅';
  if (c.includes('rain') || c.includes('drizzle'))   return '🌧️';
  if (c.includes('thunder') || c.includes('storm'))  return '⛈️';
  if (c.includes('snow'))                             return '❄️';
  if (c.includes('mist') || c.includes('fog'))       return '🌫️';
  return '🌤️';
}
