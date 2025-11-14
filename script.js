// Variables (Global)
let posts = [];                // in-memory post list
let editingPostId = null;      // if non-null, the form is in "edit mode" for this post id

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
//  nowISO() * Returns a timezone-aware ISO string for timestamps.*/
function nowISO() {
  return new Date().toISOString();
}
/**
 * safeParseJSON(json, fallback)
 *parse JSON and return fallback on error.*/
function safeParseJSON(json, fallback = []) {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (err) {
    console.warn('safeParseJSON: invalid JSON, returning fallback', err);
    return fallback;
  }
}

/**
 * saveToLocalStorage()
 * Stringifies the posts array and saves in localStorage under LS_KEY.
 */
function saveToLocalStorage() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('saveToLocalStorage failed:', err);
  }
}

// load posts from local storage
function loadFromLocalStorage() {
  const raw = localStorage.getItem(LS_KEY);
  posts = safeParseJSON(raw, []);
}


 // escapeHtml(str) *Small helper to escape user-provided strings before inserting into HTML.
// Prevents simple HTML injection when rendering. */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Load posts from localstorage (initialization)
//    On script load we read saved posts and render them immediately./

function initializeApp() {
  loadFromLocalStorage();
  renderPosts();
  attachFormInputListeners();
}

// Initialize on script load 
initializeApp();

//Render Posts dunction-
function renderPosts() {
  // Clear container
  postsContainer.innerHTML = '';

  if (!posts.length) {
    // If there are no posts, show a friendly message
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'You have no posts yet. Create one using the form.';
    postsContainer.appendChild(empty);
    return;
  }
  //  Render newest first (sort by created,newest at top)
  const sorted = [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  sorted.forEach(post => {
    // Create the post card element
    const postEl = document.createElement('article');
    postEl.className = 'post';
    postEl.dataset.id = post.id; // store id for delegation

/// Build inner HTML — escape user content to avoid injection
    postEl.innerHTML = `
      <div class="meta">
        Created: ${escapeHtml(new Date(post.createdAt).toLocaleString())}
        ${post.updatedAt && post.updatedAt !== post.createdAt ? ' • Updated: ' + escapeHtml(new Date(post.updatedAt).toLocaleString()) : ''}
      </div>
      <h3>${escapeHtml(post.title)}</h3>
      <p class="content">${escapeHtml(post.content)}</p>

      <div class="post-buttons">
        <button class="edit-btn" data-action="edit" data-id="${post.id}">Edit</button>
        <button class="delete-btn" data-action="delete" data-id="${post.id}">Delete</button>
      </div>
    `;

    postsContainer.appendChild(postEl);
  });
}

// Handle new post form submission
//  - Prevent default form submission
   /* Validate inputs *title and content required
    If editingPostId is null ->create new post
   If editingPostId is set ->update existing post
   Save to localStorage and re-render
   Clear form and reset edit state

 // Attach submit event listener*/
 postForm.addEventListener('submit', function (event) {
  // Prevent default page reload
  event.preventDefault();

// Gather values and trim whitespace
  const title = titleInput.value ? titleInput.value.trim() : '';
  const content = contentInput.value ? contentInput.value.trim() : '';
 
// Validate inputs
  const errors = validateInputs(title, content);
  if (Object.keys(errors).length) {
 // Show validation errors and abort submission
    displayValidationErrors(errors);
    return;
  }

 // No validation errors — proceed
  if (editingPostId) {
    // EDIT flow: update the existing post
    const updated = updatePost(editingPostId, title, content);
    if (!updated) {
      // If update failed (post not found), show a general error
      alert('Failed to update: post not found.');
    }
  } else {
    // CREATE flow: create a new post object and push to posts array
    createNewPost(title, content);
  } 

/// Persist and refresh UI
  saveToLocalStorage();
  renderPosts();

  // Reset form and edit state
  resetForm();
});

/*  Helper: validateInputs(title, content) ---
   Returns an object with keys for fields that have errors.*/
   function validateInputs(title, content) {
  const errors = {};
  if (!title) errors.title = 'Title is required.';
  if (!content) errors.content = 'Content is required.';

  // length constraints 
  if (title && title.length > 200) errors.title = 'Title must be 200 characters or fewer.';
  if (content && content.length > 5000) errors.content = 'Content must be 5000 characters or fewer.';

  return errors;
}

// Helper: updates inline error spans close to input*/

function displayValidationErrors(errors) {
  titleError.textContent = errors.title || '';
  contentError.textContent = errors.content || '';
}

// Helper: clearValidationerrors
function clearValidationErrors() {
  titleError.textContent = '';
  contentError.textContent = '';
}

// Createnewpost
function createNewPost(title, content) {
  const newPost = {
    id: generateId(),
    title,
    content,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  posts.push(newPost);
}

/* --- updatePost(id, title, content) --- */
function updatePost(id, title, content) {
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return null;
  posts[idx].title = title;
  posts[idx].content = content;
  posts[idx].updatedAt = nowISO();
  return posts[idx];
}

/* --- resetForm() ---
   Clears inputs, errors, and exits edit mode.
*/
function resetForm() {
  postForm.reset();
  editingPostId = null;
  submitBtn.textContent = 'Add Post';
  clearValidationErrors();
}

//Handle Delete post-post id attach a single click listener to postsContainer and handle clicks on elements to post id*/
postsContainer.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === 'delete') {
const post = posts.find(p => p.id === id);
    const titleForPrompt = post && post.title ? `"${post.title}"` : 'this post';
    if (!confirm(`Delete ${titleForPrompt}? This action cannot be undone.`)) return;

// Remove from posts array
    const removed = deletePostById(id);
    if (removed) {
      saveToLocalStorage();
      renderPosts()

// if editing the post, reset the form
      if (editingPostId === id) resetForm();
    } else {
      alert('Failed to delete: post not found.');
    }
  } else if (action === 'edit') {

    /// Handle Edit Post- Populate the form with existing post content and set editingPostId.
    const post = posts.find(p => p.id === id);
    if (!post) {
      alert('Post not found.');
      return;
    }
    enterEditMode(post);
  }
});

/* --- deletePostById(id) Removes a post from the posts array by id. Returns true on success, false if not found.
*/

function deletePostById(id) {
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return false;
  posts.splice(idx, 1);
  return true;
}

function attachFormInputListeners() {
  titleInput.addEventListener('input', function () {
    if (titleError.textContent) titleError.textContent = '';
  });

  contentInput.addEventListener('input', function () {
    if (contentError.textContent) contentError.textContent = '';
  });
}

// Handle Delete Post*/