/* ═══════════════════════════════════════════════════════
   RiwiFlow — SPA Application Logic
   ═══════════════════════════════════════════════════════ */

const API = "http://localhost:3000";

/* ── State ─────────────────────────────────────────── */
const state = {
  user: null,      // logged-in user object
  users: [],       // all users (for assign dropdown)
  tasks: [],       // all tasks
  editingId: null, // task id being edited (null = new)
  searchQuery: "",
};

/* ── Router ────────────────────────────────────────── */
function navigate(route) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  document.getElementById(`view-${route}`).classList.add("active");
  window.location.hash = route;
}

function initRouter() {
  const hash = window.location.hash.replace("#", "") || "login";
  const user = getSession();
  if (hash === "board" && !user) return navigate("login");
  if (hash === "login" && user) {
    state.user = user;
    return navigate("board");
  }
  if (user) state.user = user;
  navigate(hash === "board" ? "board" : "login");
}

/* ── Session ───────────────────────────────────────── */
function saveSession(user) {
  localStorage.setItem("riwi_user", JSON.stringify(user));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem("riwi_user")); }
  catch { return null; }
}
function clearSession() {
  localStorage.removeItem("riwi_user");
}

/* ── API helpers ───────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function fetchUsers() {
  state.users = await apiFetch("/users");
}

async function fetchTasks() {
  state.tasks = await apiFetch("/tasks");
}

async function createTask(data) {
  const task = await apiFetch("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
  state.tasks.push(task);
}

async function updateTask(id, data) {
  const task = await apiFetch(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  const idx = state.tasks.findIndex((t) => t.id === id);
  if (idx !== -1) state.tasks[idx] = task;
}

/* ── Auth ──────────────────────────────────────────── */
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorBox = document.getElementById("login-error");
  const errorMsg = document.getElementById("login-error-msg");

  errorBox.classList.add("hidden");

  if (!email || !password) {
    errorMsg.textContent = "Please enter your email and password.";
    errorBox.classList.remove("hidden");
    return;
  }

  try {
    const users = await apiFetch(`/users?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    if (users.length === 0) {
      errorMsg.textContent = "Invalid credentials. Please try again.";
      errorBox.classList.remove("hidden");
      return;
    }
    state.user = users[0];
    saveSession(state.user);
    await loadBoard();
    navigate("board");
  } catch (err) {
    errorMsg.textContent = "Server error. Make sure json-server is running.";
    errorBox.classList.remove("hidden");
  }
}

function handleLogout() {
  clearSession();
  state.user = null;
  state.tasks = [];
  navigate("login");
}

/* ── Board rendering ───────────────────────────────── */
const COLUMNS = [
  { id: "todo",       label: "To Do",       color: "text-outline" },
  { id: "inprogress", label: "In Progress",  color: "text-primary" },
  { id: "inreview",   label: "In Review",    color: "text-tertiary" },
  { id: "done",       label: "Done",         color: "text-green-600" },
];

const STATUS_LABELS = {
  todo: "To Do",
  inprogress: "In Progress",
  inreview: "In Review",
  done: "Done",
};

const TAG_COLORS = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-fixed text-on-tertiary-fixed",
  "bg-surface-container-high text-on-surface-variant",
];

function getTagColor(str) {
  let hash = 0;
  for (let c of str) hash += c.charCodeAt(0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function getUserName(userId) {
  const u = state.users.find((u) => u.id === userId);
  return u ? u.name : "Unassigned";
}

function getUserInitial(userId) {
  const name = getUserName(userId);
  return name.charAt(0).toUpperCase();
}

function canEditTask(task) {
  if (!state.user) return false;
  if (state.user.role === "admin") return true;
  return task.userId === state.user.id;
}

function renderBoard() {
  const query = state.searchQuery.toLowerCase();

  COLUMNS.forEach(({ id }) => {
    const col = document.getElementById(`col-${id}`);
    const countEl = document.getElementById(`count-${id}`);
    col.innerHTML = "";

    const filtered = state.tasks.filter((t) => {
      const matchCol = t.status === id;
      const matchSearch = !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query);
      return matchCol && matchSearch;
    });

    countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      col.innerHTML = `<p class="text-body-sm text-on-surface-variant text-center py-8 opacity-60">No tasks</p>`;
      return;
    }

    filtered.forEach((task) => {
      const card = document.createElement("div");
      card.className = "task-card bg-surface border border-outline-variant rounded-xl p-md shadow-sm cursor-default";

      const editable = canEditTask(task);
      const isDone = task.status === "done";
      const tagColor = getTagColor(task.title);

      card.innerHTML = `
        <div class="flex items-start justify-between mb-xs">
          <span class="px-2 py-0.5 rounded-full text-label-sm ${tagColor}">${STATUS_LABELS[task.status]}</span>
          ${editable ? `
            <button class="edit-btn material-symbols-outlined text-outline hover:text-primary transition-colors text-[18px]"
              data-id="${task.id}">edit</button>` : ""}
        </div>
        <h4 class="text-label-md text-on-surface mb-xs ${isDone ? "line-through opacity-60" : ""}">
          ${escapeHtml(task.title)}
        </h4>
        <p class="text-body-sm text-on-surface-variant">
          ${escapeHtml(task.description)}
        </p>
        <div class="mt-md flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary text-[10px] font-bold">
              ${getUserInitial(task.userId)}
            </div>
            <span class="text-label-sm text-on-surface-variant">${getUserName(task.userId)}</span>
          </div>
          ${isDone ? `<span class="material-symbols-outlined text-green-500 text-[20px]" style="font-variation-settings:'FILL' 1">check_circle</span>` : ""}
        </div>
      `;

      const editBtn = card.querySelector(".edit-btn");
      if (editBtn) {
        editBtn.addEventListener("click", () => openModal(parseInt(editBtn.dataset.id)));
      }

      col.appendChild(card);
    });
  });
}

/* ── Modal ─────────────────────────────────────────── */
function openModal(taskId = null) {
  state.editingId = taskId;
  const modal = document.getElementById("task-modal");
  const titleEl = document.getElementById("modal-title");
  const fieldTitle = document.getElementById("field-title");
  const fieldUser = document.getElementById("field-user");
  const taskTitleInput = document.getElementById("task-title");
  const taskDesc = document.getElementById("task-desc");
  const taskStatus = document.getElementById("task-status");
  const taskUser = document.getElementById("task-user");

  const isAdmin = state.user.role === "admin";

  // Populate user dropdown (admin only)
  taskUser.innerHTML = state.users
    .map((u) => `<option value="${u.id}">${u.name} (${u.role})</option>`)
    .join("");

  if (taskId !== null) {
    // Edit mode
    const task = state.tasks.find((t) => t.id === taskId);
    titleEl.textContent = "Edit Task";
    taskTitleInput.value = task.title;
    taskDesc.value = task.description;
    taskStatus.value = task.status;
    taskUser.value = task.userId;

    // Coder: hide title & user fields
    fieldTitle.style.display = isAdmin ? "" : "none";
    fieldUser.style.display = isAdmin ? "" : "none";
  } else {
    // Create mode (admin only)
    titleEl.textContent = "New Task";
    taskTitleInput.value = "";
    taskDesc.value = "";
    taskStatus.value = "todo";
    taskUser.value = state.users[0]?.id || "";
    fieldTitle.style.display = "";
    fieldUser.style.display = "";
  }

  modal.classList.add("open");
}

function closeModal() {
  document.getElementById("task-modal").classList.remove("open");
  state.editingId = null;
}

async function handleSave() {
  const title = document.getElementById("task-title").value.trim();
  const description = document.getElementById("task-desc").value.trim();
  const status = document.getElementById("task-status").value;
  const userId = parseInt(document.getElementById("task-user").value);
  const isAdmin = state.user.role === "admin";

  try {
    if (state.editingId !== null) {
      // Edit
      const existing = state.tasks.find((t) => t.id === state.editingId);
      const updates = { status, description };
      if (isAdmin) {
        if (!title) { alert("Title is required."); return; }
        updates.title = title;
        updates.userId = userId;
      }
      await updateTask(state.editingId, updates);
    } else {
      // Create (admin only)
      if (!title) { alert("Title is required."); return; }
      await createTask({ title, description, status, userId });
    }
    closeModal();
    renderBoard();
  } catch (err) {
    alert("Error saving task. Check server connection.");
  }
}

/* ── Board init ────────────────────────────────────── */
async function loadBoard() {
  await fetchUsers();
  await fetchTasks();

  // Update UI with user info
  const user = state.user;
  document.getElementById("sidebar-name").textContent = user.name;
  document.getElementById("sidebar-role").textContent = user.role;
  document.getElementById("header-user").textContent = user.name;
  document.getElementById("header-avatar").textContent = user.name.charAt(0).toUpperCase();

  // Show/hide New Task button based on role
  const newTaskBtn = document.getElementById("btn-new-task");
  newTaskBtn.style.display = user.role === "admin" ? "" : "none";

  renderBoard();
}

/* ── Utility ───────────────────────────────────────── */
function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Event listeners ───────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
  // Login
  document.getElementById("login-btn").addEventListener("click", handleLogin);
  document.getElementById("login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Logout
  document.getElementById("btn-logout").addEventListener("click", handleLogout);

  // New task (admin)
  document.getElementById("btn-new-task").addEventListener("click", () => openModal(null));

  // Modal controls
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("modal-save").addEventListener("click", handleSave);
  document.getElementById("task-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderBoard();
  });

  // Router
  initRouter();

  // If session exists, load board data
  if (state.user) {
    await loadBoard();
  }
});