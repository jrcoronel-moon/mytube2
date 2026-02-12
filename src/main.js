import './style.css'

const player = document.getElementById('player');
const noSignal = document.getElementById('noSignal');
const channelBar = document.getElementById('channelBar');
const modal = document.getElementById('modal');
const channelList = document.getElementById('channelList');

let channels = Array(10).fill(''); // 10 channel URLs
let activeChannel = -1;

// Extract YouTube video ID
function getYouTubeID(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Load channels from server
async function loadChannels() {
  try {
    const res = await fetch('/api/channels');
    if (res.ok) {
      const data = await res.json();
      channels = data.length >= 10 ? data.slice(0, 10) : [...data, ...Array(10 - data.length).fill('')];
    }
  } catch (err) {
    console.error('Failed to load channels:', err);
  }
  renderChannelBar();
}

// Render channel buttons
function renderChannelBar() {
  channelBar.innerHTML = '';
  channels.forEach((url, i) => {
    const btn = document.createElement('button');
    btn.className = 'channel-btn';
    if (!url) btn.classList.add('empty');
    if (i === activeChannel) btn.classList.add('active');
    btn.textContent = i === 9 ? '0' : String(i + 1);
    btn.onclick = () => switchChannel(i);
    channelBar.appendChild(btn);
  });
}

// Switch to a channel
function switchChannel(index) {
  const url = channels[index];
  activeChannel = index;

  if (!url) {
    player.style.display = 'none';
    noSignal.style.display = 'flex';
  } else {
    const id = getYouTubeID(url);
    if (id) {
      player.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=0`;
      player.style.display = 'block';
      noSignal.style.display = 'none';
    } else {
      player.style.display = 'none';
      noSignal.style.display = 'flex';
    }
  }

  renderChannelBar();
}

// Settings modal
function openEditor() {
  channelList.innerHTML = '';
  channels.forEach((url, i) => {
    const row = document.createElement('div');
    row.className = 'channel-row';

    const label = document.createElement('label');
    label.textContent = i === 9 ? '0' : String(i + 1);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'YouTube URL...';
    input.value = url;
    input.dataset.index = i;

    row.appendChild(label);
    row.appendChild(input);
    channelList.appendChild(row);
  });

  modal.style.display = 'flex';
}

function closeEditor() {
  modal.style.display = 'none';
}

async function saveChannels() {
  const inputs = channelList.querySelectorAll('input');
  inputs.forEach(input => {
    channels[parseInt(input.dataset.index)] = input.value.trim();
  });

  try {
    await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channels),
    });
  } catch (err) {
    console.error('Failed to save channels:', err);
  }

  closeEditor();
  renderChannelBar();

  // If current channel was updated, refresh it
  if (activeChannel >= 0) {
    switchChannel(activeChannel);
  }
}

async function quitApp() {
  try {
    await fetch('/api/shutdown', { method: 'POST' });
    document.body.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;">
        <h1>App Closed. You can close this tab.</h1>
      </div>`;
    window.close();
  } catch (err) {
    console.error('Error shutting down:', err);
  }
}

// Event listeners
document.getElementById('settingsBtn').addEventListener('click', openEditor);
document.getElementById('quitBtn').addEventListener('click', quitApp);
document.getElementById('saveBtn').addEventListener('click', saveChannels);
document.getElementById('cancelBtn').addEventListener('click', closeEditor);

// Keyboard: 1-9 and 0 for channels
document.addEventListener('keydown', (e) => {
  // Don't capture keys when typing in inputs
  if (e.target.tagName === 'INPUT') return;

  if (e.key >= '1' && e.key <= '9') {
    switchChannel(parseInt(e.key) - 1);
  } else if (e.key === '0') {
    switchChannel(9);
  }
});

// Close modal on overlay click
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeEditor();
});

// Init
loadChannels();
