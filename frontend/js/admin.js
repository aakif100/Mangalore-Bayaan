// Admin script for managing recordings with optional API + localStorage fallback
const STORAGE_KEY = 'mangalore_lectures';
const API_BASE = '';// same origin; server serves /api/lectures

function el(id){return document.getElementById(id)}

function getToken(){
  return localStorage.getItem('mb_token');
}

async function apiGetLectures(){
  try{
    const headers = {};
    const token = getToken();
    if(token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(`${API_BASE}/api/lectures`, {headers});
    if(!res.ok) throw new Error('API error');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }catch(err){
    // console.warn('API get failed', err);
    throw err;
  }
}

async function apiAddLecture(item){
  const headers = {'Content-Type':'application/json'};
  const token = getToken(); if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(`${API_BASE}/api/lectures`, {method:'POST',headers,body:JSON.stringify(item)});
  if(!res.ok) throw new Error('API add failed');
  return res.json();
}

function extractYouTubeID(raw){
  if(!raw) return '';
  const vMatch = String(raw).match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if(vMatch) return vMatch[1];
  const short = String(raw).match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if(short) return short[1];
  const embed = String(raw).match(/embed\/([A-Za-z0-9_-]{11})/);
  if(embed) return embed[1];
  const vpath = String(raw).match(/\/v\/([A-Za-z0-9_-]{11})/);
  if(vpath) return vpath[1];
  if(/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  return raw;
}

async function apiUpdateLecture(id, item){
  const headers = {'Content-Type':'application/json'};
  const token = getToken(); if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(`${API_BASE}/api/lectures/${id}`, {method:'PUT',headers,body:JSON.stringify(item)});
  if(!res.ok) throw new Error('API update failed');
  return res.json();
}

async function apiUploadFile(file){
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const headers = {};
  if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(`${API_BASE}/api/upload`, {method:'POST', body: form, headers});
  if(!res.ok) throw new Error('Upload failed');
  return res.json();
}

async function apiDeleteLecture(id){
  const headers = {};
  const token = getToken(); if(token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(`${API_BASE}/api/lectures/${id}`, {method:'DELETE', headers});
  if(!res.ok) throw new Error('API delete failed');
  return res.json();
}

function lsGet(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }catch(e){
    console.error('Failed to read lectures', e);
    return [];
  }
}

function lsSave(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr, null, 2));
}

async function getLectures(){
  // try API first
  try{
    return await apiGetLectures();
  }catch(_){
    return lsGet();
  }
}

async function renderList(){
  const list = el('list');
  const data = await getLectures();
  list.innerHTML = '';
  if(!data || data.length===0){
    list.innerHTML = '<div class="muted">No recordings yet</div>';
    return;
  }
  data.slice().reverse().forEach(item=>{
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <div>
        <div style="font-weight:600">${item.title}</div>
        <div class="muted">${item.speaker || ''} • ${item.date ? (new Date(item.date)).toISOString().slice(0,10) : ''} • ${item.tags ? item.tags.join(', ') : ''} • ${item.mediaType || (item.videoId ? 'youtube' : (item.mediaUrl? 'file':''))}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="play-btn" data-id="${item._id||item.id||''}" onclick="openInUser(event)">Open</button>
        <button onclick="startEdit('${item._id||item.id||''}')">Edit</button>
        <button onclick="deleteItem('${item._id||item.id||''}')">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

async function deleteItem(id){
  if(!id) return alert('Missing id');
  // try API
  try{
    await apiDeleteLecture(id);
    await renderList();
    return;
  }catch(_){
    // fallback to localStorage
    const data = lsGet().filter(x=> (x.id !== id && x._id !== id));
    lsSave(data);
    await renderList();
  }
}

// start editing an item: populate form with data
async function startEdit(id){
  if(!id) return;
  // try API first
  try{
    const res = await fetch(`${API_BASE}/api/lectures/${id}`);
    if(res.ok){
      const item = await res.json();
      fillFormForEdit(item);
      return;
    }
  }catch(_){/*fallback*/}
  // fallback to local storage
  const local = lsGet();
  const it = local.find(x=> x.id===id || x._id===id);
  if(it) fillFormForEdit(it);
}

function fillFormForEdit(item){
  el('editId').value = item._id || item.id || '';
  el('title').value = item.title || '';
  el('speaker').value = item.speaker || '';
  el('date').value = item.date ? (new Date(item.date)).toISOString().slice(0,10) : '';
  el('tags').value = (item.tags || []).join(', ');
  el('videoId').value = item.videoId || '';
  el('masjid').value = item.masjid || '';
  el('submitBtn').textContent = 'Save changes';
}

function openInUser(e){
  // Try to open index.html in a new tab
  window.open('index.html','_blank');
}

document.getElementById('year').textContent = new Date().getFullYear();

// form handling
const form = document.getElementById('addForm');
form.addEventListener('submit', async (ev)=>{
  ev.preventDefault();
  const title = el('title').value.trim();
  if(!title) return alert('Title required');
  const speaker = el('speaker').value.trim();
  const date = el('date').value || new Date().toISOString().slice(0,10);
  // Use selected tags from the Set rather than splitting the input value
  const tags = Array.from(selectedTags);
  const videoId = el('videoId').value.trim();
  const masjid = el('masjid').value.trim();
  const item = {
    title, speaker, date, tags, videoId: extractYouTubeID(videoId), masjid
  };
  const editId = el('editId').value;
  if(editId){
    // update
    console.log('Updating lecture with data:', item); // Debug log
    try{
      await apiUpdateLecture(editId, item);
      form.reset(); el('editId').value = '';
      el('submitBtn').textContent = 'Add recording';
      await renderList();
      alert('Recording updated on server. Refresh public page to see changes.');
      return;
    }catch(err){
      // fallback to localStorage update
      const local = lsGet();
      const idx = local.findIndex(x=> x.id===editId || x._id===editId);
      if(idx!==-1){
        local[idx] = Object.assign(local[idx], Object.assign({id: editId}, item));
        lsSave(local);
        form.reset(); el('editId').value = '';
        el('submitBtn').textContent = 'Add recording';
        await renderList();
        alert('Recording updated locally (server unreachable).');
        return;
      }
      alert('Failed to update recording');
    }
  }
  // create
  try{
    // if there's a local file selected, upload first
    const fileInput = el('mediaFile');
    if(fileInput && fileInput.files && fileInput.files[0]){
      try{
        const up = await apiUploadFile(fileInput.files[0]);
        item.mediaType = up.mediaType || 'video';
        item.mediaUrl = up.url;
      }catch(err){
        console.error('Upload failed', err);
        alert('File upload failed, aborting.');
        return;
      }
    }
    await apiAddLecture(item);
    form.reset();
    await renderList();
    alert('Recording added to server. Open the public page and refresh to see it.');
    return;
  }catch(err){
    // fallback to localStorage
    const local = lsGet();
    local.push(Object.assign({id: Date.now().toString()}, item));
    lsSave(local);
    form.reset();
    await renderList();
    alert('Recording added to local storage (server unreachable).');
  }
});

el('clearBtn').addEventListener('click', ()=>form.reset());

// Export
el('exportBtn').addEventListener('click', async ()=>{
  const data = await getLectures();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'mangalore_lectures.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Import
el('importBtn').addEventListener('click', ()=>el('importFile').click());
el('importFile').addEventListener('change', (ev)=>{
  const f = ev.target.files[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = async (e)=>{
    try{
      const parsed = JSON.parse(e.target.result);
      if(!Array.isArray(parsed)) throw new Error('JSON must be an array');
      // basic validation and ensure ids
      const normalized = parsed.map(it=>({
        id: it.id || Date.now().toString() + Math.random().toString(36).slice(2,6),
        title: it.title||'(no title)',
        speaker: it.speaker||'',
        date: it.date||new Date().toISOString().slice(0,10),
        tags: Array.isArray(it.tags) ? it.tags : (typeof it.tags==='string' ? it.tags.split(',').map(s=>s.trim()).filter(Boolean) : []),
        videoId: extractYouTubeID(it.videoId||'')
      }));
      // try API bulk import by posting each item
      try{
        for(const item of normalized){
          await apiAddLecture(item);
        }
        alert('Imported to server: ' + normalized.length + ' recordings.');
        await renderList();
        return;
      }catch(_){
        // fallback
        lsSave(normalized);
        renderList();
        alert('Imported to local storage: ' + normalized.length + ' recordings.');
      }
    }catch(err){
      alert('Failed to import JSON: ' + err.message);
    }
  };
  reader.readAsText(f);
});

// Handle speakers and tags suggestions
let allSpeakers = new Set();
let allMasjids = new Set();
let allTags = new Set();
let selectedTags = new Set();

async function updateSpeakersAndTags() {
  const lectures = await getLectures();
  
  // Collect unique speakers, masjids, and tags
  allSpeakers.clear();
  allMasjids.clear();
  allTags.clear();
  lectures.forEach(lecture => {
    if (lecture.speaker) allSpeakers.add(lecture.speaker);
    if (lecture.masjid) allMasjids.add(lecture.masjid);
    if (lecture.tags) lecture.tags.forEach(tag => allTags.add(tag));
  });

  // Update speakers datalist
  const speakersList = el('speakersList');
  speakersList.innerHTML = Array.from(allSpeakers)
    .sort()
    .map(speaker => `<option value="${speaker}">`)
    .join('');
    
  // Update masjids datalist
  const masjidList = el('masjidList');
  masjidList.innerHTML = Array.from(allMasjids)
    .sort()
    .map(masjid => `<option value="${masjid}">`)
    .join('');

  // Setup tags input handling
  const tagsInput = el('tags');
  const tagsList = el('tagsList');
  const selectedTagsContainer = el('selectedTags');

  // Update tags datalist
  tagsList.innerHTML = Array.from(allTags)
    .sort()
    .map(tag => `<option value="${tag}">`)
    .join('');

  function addTag(tag) {
    tag = tag.trim();
    if (tag && !selectedTags.has(tag)) {
      selectedTags.add(tag);
      renderSelectedTags();
    }
  }

  function renderSelectedTags() {
    selectedTagsContainer.innerHTML = Array.from(selectedTags)
      .map(tag => `
        <span class="selected-tag">
          ${tag}
          <button onclick="removeTag('${tag}')" type="button" class="tag-remove">×</button>
        </span>
      `)
      .join('');
    // Update the hidden input value with the current tags
    tagsInput.value = Array.from(selectedTags).join(', ');
  }

  // Handle tag input and datalist selection
  tagsInput.addEventListener('input', (e) => {
    if (e.inputType === 'insertReplacementText' || e.target.value.endsWith(',')) {
      const tag = e.target.value.replace(/,$/, '').trim();
      if (tag) {
        addTag(tag);
        e.target.value = '';
      }
    }
  });

  // Add tag on datalist option selection
  tagsInput.addEventListener('change', (e) => {
    const tag = e.target.value.trim();
    if (tag) {
      addTag(tag);
      e.target.value = '';
    }
  });

  // Handle Enter key
  tagsInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = e.target.value.trim();
      if (tag) {
        addTag(tag);
        e.target.value = '';
      }
    }
  });

    // Handle blur event
  tagsInput.addEventListener('blur', (e) => {
    setTimeout(() => {
      const tag = e.target.value.trim();
      if (tag) {
        addTag(tag);
        e.target.value = '';
      }
    }, 100);
  });
}

// Global function to remove tags
window.removeTag = function(tag) {
  selectedTags.delete(tag);
  const selectedTagsContainer = el('selectedTags');
  selectedTagsContainer.innerHTML = Array.from(selectedTags)
    .map(tag => `
      <span class="selected-tag">
        ${tag}
        <button onclick="removeTag('${tag}')" type="button">×</button>
      </span>
    `)
    .join('');
  el('tags').value = Array.from(selectedTags).join(', ');
};

// Modify fillFormForEdit to handle tags
const originalFillFormForEdit = fillFormForEdit;
fillFormForEdit = function(item) {
  originalFillFormForEdit(item);
  selectedTags = new Set(item.tags || []);
  const selectedTagsContainer = el('selectedTags');
  selectedTagsContainer.innerHTML = Array.from(selectedTags)
    .map(tag => `
      <span class="selected-tag">
        ${tag}
        <button onclick="removeTag('${tag}')" type="button">×</button>
      </span>
    `)
    .join('');
};

// initial render
renderList().then(() => {
  updateSpeakersAndTags();
});

// Auth UI
function updateLoginUI(){
  const token = getToken();
  const status = token ? 'Logged in' : 'Not logged in';
  el('loginStatus').textContent = status;
  if(token){
    el('loginBtn').style.display = 'none';
    el('logoutBtn').style.display = 'inline-block';
    el('adminPassword').style.display = 'none';
  }else{
    el('loginBtn').style.display = 'inline-block';
    el('logoutBtn').style.display = 'none';
    el('adminPassword').style.display = 'inline-block';
  }
}

async function login(){
  const pw = el('adminPassword').value;
  if(!pw) return alert('Enter password');
  try{
    const res = await fetch(`${API_BASE}/api/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password: pw})});
    if(!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('mb_token', data.token);
    el('adminPassword').value = '';
    updateLoginUI();
    alert('Logged in (token stored)');
  }catch(err){
    alert('Login failed');
  }
}

function logout(){
  localStorage.removeItem('mb_token');
  updateLoginUI();
  alert('Logged out');
}

el('loginBtn').addEventListener('click', login);
el('logoutBtn').addEventListener('click', logout);

updateLoginUI();
