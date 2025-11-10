// Helper function to get media type label
function getMediaTypeLabel(item) {
  if (item.mediaType === 'youtube' || item.videoId) {
    return 'YouTube';
  }
  
  if (item.mediaUrl) {
    const url = item.mediaUrl.toLowerCase();
    if (url.endsWith('.mp3')) return 'MP3';
    if (url.endsWith('.mp4')) return 'MP4';
    if (url.endsWith('.aac')) return 'AAC';
    if (url.endsWith('.m4a')) return 'M4A';
    if (url.endsWith('.wav')) return 'WAV';
    if (url.endsWith('.ogg')) return 'OGG';
    if (url.endsWith('.flac')) return 'FLAC';
    // Fallback to mediaType if extension not recognized
    return item.mediaType === 'audio' ? 'Audio' : 'Video';
  }
  
  return 'Unknown';
}

const defaultLectures = [
  {
    id: '1',
    title: 'Understanding the Qur\'an: Short Tafsir',
    speaker: 'Ustadh Ali',
    date: '2025-10-04',
    tags: ['tafsir'],
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: '2',
    title: 'Practical Fiqh for Daily Life',
    speaker: 'Dr. Zain',
    date: '2025-08-21',
    tags: ['fiqh'],
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: '3',
    title: 'Seerah: Lessons from the Prophet\'s Life',
    speaker: 'Moulana Kareem',
    date: '2025-09-11',
    tags: ['seerah'],
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: '4',
    title: 'Stories for Kids — Short Bayaan',
    speaker: 'Sister Amina',
    date: '2025-07-05',
    tags: ['kids'],
    videoId: 'dQw4w9WgXcQ'
  },
  {
    id: '5',
    title: 'Sahih Bukhari: Understanding Hadith',
    speaker: 'Moulana Hassan',
    date: '2025-10-15',
    tags: ['kutubah'],
    videoId: 'dQw4w9WgXcQ'
  }
];

const API_BASE = '';

async function apiGetLectures(){
  try{
    const res = await fetch(`${API_BASE}/api/lectures`);
    if(!res.ok) throw new Error('API error');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }catch(err){
    throw err;
  }
}

function lsGet(){
  try{
    const raw = localStorage.getItem('mangalore_lectures');
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length) return parsed;
    }
  }catch(e){
    console.warn('Failed to parse stored lectures', e);
  }
  return null;
}

async function loadLectures(){
  // prefer API
  try{
    const data = await apiGetLectures();
    if(Array.isArray(data) && data.length) return data;
  }catch(_){
    // ignore, fallback below
  }
  const ls = lsGet();
  if(ls) return ls;
  return defaultLectures.slice();
}

let lectures = [];

const lecturesEl = document.getElementById('lectures');
const searchInput = document.getElementById('searchInput');
const chips = document.getElementById('chips');
const modal = document.getElementById('playerModal');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.getElementById('modalBackdrop');
const videoWrap = document.getElementById('videoWrap');
const videoMeta = document.getElementById('videoMeta');

function renderCards(data){
  lecturesEl.innerHTML = '';
  data.forEach(item => {
  const card = document.createElement('article');
    card.className = 'card';
    // Determine media type and URL/id
    // Priority: 1. mediaType field, 2. videoId (youtube), 3. mediaUrl extension, 4. default to youtube
    let normalizedVideoId = '';
    let mediaType = item.mediaType;
    
    // If no mediaType set, try to infer from videoId or mediaUrl
    if (!mediaType) {
      if (item.videoId) {
        mediaType = 'youtube';
      } else if (item.mediaUrl) {
        // Check if it's a GridFS URL (starts with /api/files/)
        if (item.mediaUrl.startsWith('/api/files/')) {
          // Can't determine from URL, default to video (should be set by backend)
          mediaType = 'video';
        } else {
          // Check file extension for non-GridFS URLs
          mediaType = String(item.mediaUrl).match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i) ? 'audio' : 'video';
        }
      } else {
        mediaType = 'youtube';
      }
    }
    
    if(mediaType === 'youtube'){
      const raw = item.videoId || item.mediaUrl || '';
      const vMatch = String(raw).match(/[?&]v=([A-Za-z0-9_-]{11})/);
      if(vMatch) normalizedVideoId = vMatch[1];
      else {
        const short = String(raw).match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        const embed = String(raw).match(/embed\/([A-Za-z0-9_-]{11})/);
        const vpath = String(raw).match(/\/v\/([A-Za-z0-9_-]{11})/);
        if(short) normalizedVideoId = short[1];
        else if(embed) normalizedVideoId = embed[1];
        else if(vpath) normalizedVideoId = vpath[1];
        else if(/^[A-Za-z0-9_-]{11}$/.test(raw)) normalizedVideoId = raw;
        else normalizedVideoId = '';
      }
    }
    const mediaUrl = item.mediaUrl || '';
    // expose id/video on card for easy click handling
  card.dataset.id = item._id || item.id || '';
  card.dataset.video = normalizedVideoId;
  card.dataset.mediatype = mediaType;
  card.dataset.mediaurl = mediaUrl;
    card.innerHTML = `
      <div class="thumb" style="background-image:linear-gradient(135deg,#cde6ee,#dff2ef);">
        <div style="text-align:center">
          <div style="font-size:14px;color:#053135;font-weight:600;text-transform:uppercase;margin-bottom:8px;letter-spacing:0.5px">${item.masjid || ''}</div>
          <div style="font-size:12px;color:#053135;opacity:0.9">${item.speaker}</div>
          <div style="font-size:13px;margin-top:6px">${item.title}</div>
        </div>
      </div>
      <div class="meta">
        <div>
          <div class="label-group">
            <span class="label">Title:</span>
            <h3 class="title">${item.title}</h3>
          </div>
          <div class="label-group">
            <span class="label">Speaker:</span>
            <span>${item.speaker}</span>
          </div>
           <div class="label-group">
            <span class="label">Masjid:</span>
            <span>${item.masjid}</span>
          </div>
          <div class="label-group">
            <span class="label">Date:</span>
            <span>${item.date ? new Date(item.date).toLocaleDateString() : ''}</span>
          </div>
          <div class="label-group">
            <span class="label">Type:</span>
            <span class="media-type">${getMediaTypeLabel(item)}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <div class="label-group" style="align-items:flex-end">
            <span class="label">Tags:</span>
            <div class="tags">${(item.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
          </div>
          <button class="play-btn" data-id="${item._id||item.id||''}" data-video="${normalizedVideoId}" data-mediatype="${mediaType}" data-mediaurl="${mediaUrl}">Play</button>
        </div>
      </div>
    `;
    lecturesEl.appendChild(card);
  });

  // attach play handlers
  // Make entire card clickable
  document.querySelectorAll('.card').forEach(card => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    const openCardMedia = () => {
      const vid = card.dataset.video;
      const id = card.dataset.id;
      const mediaType = card.dataset.mediatype;
      const mediaUrl = card.dataset.mediaurl;
      if (mediaType === 'youtube' && vid) {
        openModal(vid, id);
      } else if ((mediaType === 'video' || mediaType === 'audio') && mediaUrl) {
        openModal(mediaUrl, id);
      }
    };

    // Mouse click handler
    card.addEventListener('click', (e) => {
      // Even if clicking the play button, use the card's handler
      e.preventDefault();
      e.stopPropagation();
      openCardMedia();
    });

    // Play button click (for visual feedback, but uses same handler)
    card.querySelector('.play-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openCardMedia();
    });

    // Keyboard accessibility: Enter or Space to open
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCardMedia();
      }
    });
  });
}

function openModal(videoId, id){
  try{
    videoWrap.innerHTML = '';
    const meta = lectures.find(l=> (l._id===id || l.id===id) );
    // Determine type: use meta.mediaType if available, otherwise infer from videoId or mediaUrl
    let type = 'video';
    if (meta) {
      type = meta.mediaType || (meta.videoId ? 'youtube' : (meta.mediaUrl ? 'video' : 'youtube'));
    } else if (videoId) {
      // If videoId is a YouTube ID (11 chars) or starts with http, it's youtube
      type = (videoId.length === 11 && /^[A-Za-z0-9_-]{11}$/.test(videoId)) || videoId.startsWith('http') ? 'youtube' : 'video';
    }
    
    console.log('Opening modal:', { videoId, id, type, meta: meta ? { mediaType: meta.mediaType, mediaUrl: meta.mediaUrl, videoId: meta.videoId } : null });

    // show modal early so users see it even if media loading takes time
    modal.setAttribute('aria-hidden','false');
  if (type === 'youtube') {
    // Use simple iframe with native YouTube controls so browser/YouTube UI handles playback
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    videoWrap.appendChild(iframe);
  } else if (type === 'video') {
    const vid = document.createElement('video');
    vid.controls = true; 
    vid.autoplay = false; // Changed to false - let user control playback
    vid.playsInline = true; 
    vid.preload = 'metadata'; // Load metadata first
    vid.style.width = '100%'; 
    vid.style.maxHeight = '70vh';
    const src = (meta && meta.mediaUrl) || videoId || '';
    console.log('Setting video src:', src, 'meta:', meta);
    
    // Ensure src is a valid URL
    if (!src) {
      console.error('No video source provided');
      videoWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">No video source found.</div>`;
      return;
    }
    
    vid.src = src;
    
    // Add comprehensive error handling
    vid.addEventListener('error', function(e) {
      const error = vid.error;
      let errorMsg = 'Error loading video';
      if (error) {
        switch(error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMsg = 'Video loading aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error loading video';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg = 'Video decoding error';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Video format not supported';
            break;
        }
      }
      console.error('Video load error:', errorMsg, error, 'src:', src);
      videoWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">${errorMsg}. Src: ${src}</div>`;
    });
    
    vid.addEventListener('loadstart', function() {
      console.log('Video loading started:', src);
    });
    
    vid.addEventListener('loadedmetadata', function() {
      console.log('Video metadata loaded:', vid.videoWidth, 'x', vid.videoHeight, 'duration:', vid.duration);
    });
    
    vid.addEventListener('canplay', function() {
      console.log('Video can play');
    });
    
    vid.addEventListener('stalled', function() {
      console.warn('Video loading stalled');
    });
    
    // ensure video mode
    videoWrap.classList.remove('audio-mode');
    videoWrap.appendChild(vid);
    // Use browser native controls for HTML5 video
  } else if (type === 'audio') {
    // Create audio element with native controls
    const aud = document.createElement('audio');
    aud.controls = true;  // Enable native controls
    aud.autoplay = false; // Changed to false - let user control playback
    aud.preload = 'metadata'; // Load metadata first
    aud.style = '';      // Reset any inline styles
    const src = (meta && meta.mediaUrl) || videoId || '';
    console.log('Setting audio src:', src, 'meta:', meta);
    
    // Ensure src is a valid URL
    if (!src) {
      console.error('No audio source provided');
      videoWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">No audio source found.</div>`;
      return;
    }
    
    aud.src = src;
    
    // Add comprehensive error handling
    aud.addEventListener('error', function(e) {
      const error = aud.error;
      let errorMsg = 'Error loading audio';
      if (error) {
        switch(error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMsg = 'Audio loading aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMsg = 'Network error loading audio';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMsg = 'Audio decoding error';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = 'Audio format not supported';
            break;
        }
      }
      console.error('Audio load error:', errorMsg, error, 'src:', src);
      videoWrap.innerHTML = `<div style="padding: 20px; text-align: center; color: red;">${errorMsg}. Src: ${src}</div>`;
    });
    
    aud.addEventListener('loadstart', function() {
      console.log('Audio loading started:', src);
    });
    
    aud.addEventListener('loadedmetadata', function() {
      console.log('Audio metadata loaded, duration:', aud.duration);
    });
    
    aud.addEventListener('canplay', function() {
      console.log('Audio can play');
    });
    
    aud.addEventListener('stalled', function() {
      console.warn('Audio loading stalled');
    });
    
    videoWrap.innerHTML = '';  // Clear any previous content
    videoWrap.classList.add('audio-mode');
    videoWrap.appendChild(aud);
  // Use browser native controls for audio
  }
    if(meta){
    videoMeta.innerHTML = `
      <strong>${meta.title}</strong>
      <div style="color:var(--muted);margin-top:6px">${meta.speaker} • ${meta.date ? new Date(meta.date).toLocaleDateString() : ''}</div>
      ${meta.masjid ? `<div style="color:var(--muted);margin-top:6px;font-weight:600">Masjid: ${meta.masjid}</div>` : ''}
    `;
  }else{
    videoMeta.innerHTML = '';
  }
  }catch(err){
    console.error('openModal error', err);
    // ensure modal visible so user can see error state
    try{ modal.setAttribute('aria-hidden','false'); }catch(e){}
  }
}

// Custom media control UI removed: using native browser controls for audio/video.
// The previous `addMediaControls` implementation was removed to keep playback native and simpler.

function closeModal(){
  modal.setAttribute('aria-hidden','true');
  // stop and cleanup media
  try{
    if(activeMediaKind === 'youtube' && activeMedia && typeof activeMedia.pauseVideo === 'function'){
      try{ activeMedia.pauseVideo(); }catch(e){}
    }
    if(activeMediaKind === 'html' && activeMedia){ try{ activeMedia.pause(); }catch(e){} }
  }catch(e){}
  clearActiveMedia();
  videoWrap.classList.remove('audio-mode');
  videoWrap.innerHTML = '';
}

modalClose.addEventListener('click', closeModal);
// Keep modal open unless explicitly closed via the close button
// (do not close on backdrop clicks)
// modalBackdrop.addEventListener('click', closeModal);

// Search & filter
// Create a set of unique masjids from all lectures
let allMasjids = new Set();

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  const activeChip = document.querySelector('.chip.active');
  const tag = activeChip ? activeChip.dataset.tag : 'all';
  const filtered = lectures.filter(l => {
    const text = (l.title + ' ' + l.speaker + ' ' + (l.masjid || '') + ' ' + l.tags.join(' ')).toLowerCase();
    const matchesQuery = q ? text.includes(q) : true;
    const matchesTag = tag && tag!=='all' ? l.tags.includes(tag) : true;
    return matchesQuery && matchesTag;
  });
  renderCards(filtered);
}

searchInput.addEventListener('input', applyFilters);

// chip behavior
chips.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    chips.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    applyFilters();
  });
});

// init
document.getElementById('year').textContent = new Date().getFullYear();
// set default active chip
chips.querySelector('.chip[data-tag="all"]').classList.add('active');

async function init(){
  lectures = await loadLectures();
  console.log('Loaded lectures:', lectures); // Debug log
  // Update masjids set with all unique masjids
  allMasjids = new Set(lectures.map(lecture => lecture.masjid).filter(Boolean));
  console.log('Unique masjids:', Array.from(allMasjids)); // Debug log
  applyFilters();
}

init();

// allow reloading from server/storage (useful after admin updates when served from same origin)
window.reloadLectures = async function(){
  lectures = await loadLectures();
  // Update masjids set when reloading lectures
  allMasjids = new Set(lectures.map(lecture => lecture.masjid).filter(Boolean));
  applyFilters();
}

// Remove site loader once all resources are loaded; keep a small buffer to allow the unblur animation
window.addEventListener('load', () => {
  const loader = document.getElementById('siteLoader');
  if (!loader) return;
  // Add hide class which transitions opacity->0 and backdrop-filter->0
  requestAnimationFrame(() => loader.classList.add('hide'));
  // Remove from DOM after transition (give a bit more than animation duration)
  setTimeout(() => {
    try{ loader.remove(); }catch(e){}
  }, 2400);
});

// Active media control state
let activeMedia = null; // either HTMLMediaElement or YT.Player
let activeMediaKind = null; // 'html' or 'youtube'
let mediaUpdateInterval = null;
let modalKeyHandler = null;

// Helper to load YouTube IFrame API once
function loadYouTubeAPI(){
  return new Promise((resolve) => {
    if(window.YT && window.YT.Player){
      return resolve(window.YT);
    }
    const existing = document.querySelector('script[data-youtube-api]');
    if(existing){
      // wait until ready
      const onYouTubeReady = () => resolve(window.YT);
      window.onYouTubeIframeAPIReady = onYouTubeReady;
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.setAttribute('data-youtube-api','1');
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    document.head.appendChild(s);
  });
}

function clearActiveMedia(){
  // stop intervals and detach keyboard handler
  if(mediaUpdateInterval) { clearInterval(mediaUpdateInterval); mediaUpdateInterval = null; }
  if(modalKeyHandler) { document.removeEventListener('keydown', modalKeyHandler); modalKeyHandler = null; }
  activeMedia = null; activeMediaKind = null;
}

// Attach keyboard handlers for modal controls (space, arrows)
function attachModalKeyboardHandlers(){
  if(modalKeyHandler) return;
  modalKeyHandler = function(e){
    // ignore when focus is in an input/textarea
    const tag = document.activeElement && document.activeElement.tagName;
    if(tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.isContentEditable) return;
    if(e.code === 'Space'){
      e.preventDefault();
      if(activeMediaKind === 'html' && activeMedia){ if(activeMedia.paused) activeMedia.play(); else activeMedia.pause(); }
      if(activeMediaKind === 'youtube' && activeMedia){ try{ const s = activeMedia.getPlayerState(); if(s===1) activeMedia.pauseVideo(); else activeMedia.playVideo(); }catch(e){} }
    }
    if(e.key === 'ArrowLeft'){
      e.preventDefault();
      if(activeMediaKind === 'html' && activeMedia) activeMedia.currentTime = Math.max(0, activeMedia.currentTime - 10);
      if(activeMediaKind === 'youtube' && activeMedia) try{ activeMedia.seekTo(Math.max(0, activeMedia.getCurrentTime() - 10), true); }catch(e){}
    }
    if(e.key === 'ArrowRight'){
      e.preventDefault();
      if(activeMediaKind === 'html' && activeMedia) activeMedia.currentTime = Math.min((activeMedia.duration||Infinity), activeMedia.currentTime + 10);
      if(activeMediaKind === 'youtube' && activeMedia) try{ const d = activeMedia.getDuration(); activeMedia.seekTo(Math.min(d||activeMedia.getCurrentTime()+10, activeMedia.getCurrentTime() + 10), true); }catch(e){}
    }
    if(e.key === '+' || e.key === '='){
      e.preventDefault();
      // increase speed
      const speeds = [0.75,1,1.25,1.5,2];
      if(activeMediaKind === 'html' && activeMedia){ let idx = speeds.indexOf(activeMedia.playbackRate); idx = (idx+1)%speeds.length; activeMedia.playbackRate = speeds[idx]; }
      if(activeMediaKind === 'youtube' && activeMedia) try{ const cr = activeMedia.getPlaybackRate(); let idx = speeds.indexOf(cr); idx = (idx+1)%speeds.length; activeMedia.setPlaybackRate(speeds[idx]); }catch(e){}
    }
  };
  document.addEventListener('keydown', modalKeyHandler);
}
