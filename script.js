// Variables (Global)
let posts = [];                // in-memory post list
let editingPostId = null;      // if non-null, the form is in "edit mode" for this post id
const LS_KEY = 'myBlogPosts';

// DOM element //
const postForm = document.getElementById('postForm');          // the form element
const titleInput = document.getElementById('title');           // title input
const contentInput = document.getElementById('content');       // content textarea
const titleError = document.getElementById('titleError');      // span for title validation messages
const contentError = document.getElementById('contentError');  // span for content validation messages
const postsContainer = document.getElementById('postsContainer'); // where posts will be rendered
const submitBtn = document.getElementById('submitBtn');       // submit button (to change text in edit mode)

// Utility FUNCTIONS *place before load to make available
// create unique id bas on timestamp & random string
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// Returns current ISO timestamp
function nowISO() {
  return new Date().toISOString();
}

// Escapes HTML special characters to prevent HTML injection
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
}

// Save posts array to localStorage
function saveToLocalStorage() {
  localStorage.setItem(LS_KEY, JSON.stringify(posts));
}

// Load posts from localStorage
function loadFromLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  posts = raw ? JSON.parse(raw) : [];
}

// --- FORM VALIDATION ---
function validateInputs(title, content) {
  const errors = {};
  if (!title) errors.title = 'Title is required.';
  if (!content) errors.content = 'Content is required.';
  if (title && title.length > 200) errors.title = 'Title must be 200 characters or fewer.';
  if (content && content.length > 5000) errors.content = 'Content must be 5000 characters or fewer.';
 return errors;
}

function displayValidationErrors(errors) {
  titleError.textContent = errors.title || '';
  contentError.textContent = errors.content || '';
}

function clearValidationErrors() {
  titleError.textContent = '';
  contentError.textContent = '';
}

// --- FORM HANDLERS ---
function resetForm() {
  postForm.reset();
  editingPostId = null;
  submitBtn.textContent = 'Add Post';
  clearValidationErrors();
}

function enterEditMode(post) {
  titleInput.value = post.title;
  contentInput.value = post.content;
  editingPostId = post.id;
  submitBtn.textContent = 'Update Post';
}
 // --- POST FUNCTIONS ---
function createNewPost(title, content) {
  posts.push({
    id: generateId(),
    title,
    content,
    createdAt: nowISO(),
    updatedAt: nowISO()
  });
}

//Update existing post by ID
function updatePost(id, title, content) {
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  posts[idx].title = title;
  posts[idx].content = content;
  posts[idx].updatedAt = nowISO();
  return posts[idx];
}

//Delete post by TD
function deletePostById(id) {
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  return true;
}
  // --- RENDER POSTS ---
function renderPosts() {
  postsContainer.innerHTML = ''; // Clear container

  if (!posts.length) {
    postsContainer.innerHTML = '<p>No posts yet. Create one using the form.</p>';
    return;
  }

  // Sort posts newest first
  const sorted = [...posts].sort((a,b) => b.createdAt.localeCompare(a.createdAt));

  sorted.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post';
    postEl.dataset.id = post.id;

    // Render post content
    postEl.innerHTML = `
      <div class="meta">
        Created: ${escapeHtml(new Date(post.createdAt).toLocaleString())}
        ${post.updatedAt && post.updatedAt !== post.createdAt ? ' • Updated: ' + escapeHtml(new Date(post.updatedAt).toLocaleString()) : ''}
      </div>
      <h3>${escapeHtml(post.title)}</h3>
      <p>${escapeHtml(post.content)}</p>
      <button class="edit-btn" data-action="edit" data-id="${post.id}">Edit</button>
      <button class="delete-btn" data-action="delete" data-id="${post.id}">Delete</button>
    `;
    postsContainer.appendChild(postEl);
  });
}

// --- FORM SUBMISSION ---
postForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  const errors = validateInputs(title, content);
  if (Object.keys(errors).length) {
    displayValidationErrors(errors);
    return;
  }

  clearValidationErrors();

  if (editingPostId) {
    updatePost(editingPostId, title, content);
  } else {
    createNewPost(title, content);
  }

  saveToLocalStorage();
  renderPosts();
  resetForm();
});

// --- EVENT DELEGATION FOR EDIT/DELETE ---
postsContainer.addEventListener('click', function(e) {
  const button = e.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;

  if (action === 'delete') {
    if (confirm('Delete this post? This cannot be undone.')) {
      deletePostById(id);
      saveToLocalStorage();
      renderPosts();
      if (editingPostId === id) resetForm();
    }
  } else if (action === 'edit') {
    const post = posts.find(p => p.id === id);
    if (post) enterEditMode(post);
  }
});

// --- INPUT LISTENERS TO CLEAR ERRORS ---
titleInput.addEventListener('input', () => { if (titleError.textContent) titleError.textContent = ''; });
contentInput.addEventListener('input', () => { if (contentError.textContent) contentError.textContent = ''; });

// --- INITIALIZE ---
loadFromLocalStorage();
renderPosts();