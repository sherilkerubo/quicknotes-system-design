const API_URL = "https://jsonplaceholder.typicode.com/posts";

// DOM Elements
const loadBtn = document.getElementById("load-btn");
const submitBtn = document.getElementById("submit-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const statusPara = document.getElementById("status");
const notesList = document.getElementById("notes-list");

// Local state tracking for loaded notes
let notes = [];

// Reusable async HTTP Request wrapper
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP Error! Status: ${response.status} ${response.statusText}`);
  }
  return response;
}

// UI State Helpers
function setStatus(message, type = "info") {
  statusPara.textContent = message;
  statusPara.className = `status-message ${type}`;
}

function clearStatus() {
  statusPara.textContent = "";
  statusPara.className = "status-message";
}

function toggleButtons(disabled) {
  loadBtn.disabled = disabled;
  submitBtn.disabled = disabled;
  document.querySelectorAll(".delete-btn").forEach(btn => btn.disabled = disabled);
}

// Render Notes to DOM safely using textContent
function renderNotes() {
  notesList.textContent = "";

  if (notes.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-message";
    emptyLi.textContent = "No notes available. Click 'Load Notes' or create a new note above.";
    notesList.appendChild(emptyLi);
    return;
  }

  notes.forEach(note => {
    const li = document.createElement("li");
    li.className = "note-item";

    const headerDiv = document.createElement("div");
    headerDiv.className = "note-header";

    const titleH3 = document.createElement("h3");
    titleH3.className = "note-title";
    titleH3.textContent = note.title; // Safe rendering via textContent

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteNote(note.id));

    headerDiv.appendChild(titleH3);
    headerDiv.appendChild(deleteBtn);

    const bodyP = document.createElement("p");
    bodyP.className = "note-body";
    bodyP.textContent = note.body || "(No body content)"; // Safe rendering via textContent

    li.appendChild(headerDiv);
    li.appendChild(bodyP);

    notesList.appendChild(li);
  });
}

// Task 1: Load Notes (GET)
async function loadNotes() {
  setStatus("Loading notes...", "info");
  toggleButtons(true);

  try {
    const response = await request(`${API_URL}?_limit=10`);
    const data = await response.json();
    notes = data;
    renderNotes();
    setStatus(`Loaded ${data.length} notes from the server.`, "success");
  } catch (err) {
    setStatus(`Failed to load notes: ${err.message}`, "error");
    console.error("GET Error:", err);
  } finally {
    toggleButtons(false);
  }
}

// Task 2: Create Note (POST)
async function createNote(e) {
  e.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  // Client-side Validation
  if (!title) {
    setStatus("Validation Error: Title is required.", "error");
    return;
  }

  if (title.length > 100) {
    setStatus("Validation Error: Title must be 100 characters or fewer.", "error");
    return;
  }

  setStatus("Creating note...", "info");
  toggleButtons(true);

  try {
    const response = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 })
    });

    const newNote = await response.json();

    // JSONPlaceholder always returns id 101 for mock POST requests
    notes.unshift(newNote);
    renderNotes();

    titleInput.value = "";
    bodyInput.value = "";
    setStatus(`Note created (status ${response.status}, id ${newNote.id}).`, "success");
  } catch (err) {
    setStatus(`Failed to create note: ${err.message}`, "error");
    console.error("POST Error:", err);
  } finally {
    toggleButtons(false);
  }
}

// Task 3: Delete Note (DELETE)
async function deleteNote(id) {
  setStatus(`Deleting note #${id}...`, "info");
  toggleButtons(true);

  try {
    const response = await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    /* 
     * JSONPlaceholder Note Handling:
     * JSONPlaceholder is a mock REST API. It simulates a successful DELETE 
     * request by responding with a 200 OK status, but it does NOT modify server state.
     * To reflect the deletion accurately in the client UI, we filter out the deleted 
     * note from our local 'notes' state array upon receiving HTTP 200.
     */
    notes = notes.filter(note => note.id !== id);
    renderNotes();
    setStatus(`Note #${id} deleted (status ${response.status}).`, "success");
  } catch (err) {
    setStatus(`Failed to delete note #${id}: ${err.message}`, "error");
    console.error("DELETE Error:", err);
  } finally {
    toggleButtons(false);
  }
}

// Event Listeners
loadBtn.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Initialize Empty State
renderNotes();