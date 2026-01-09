// Penyimpanan sementara untuk daftar todo
let todos = [];

// Ambil semua elemen dari HTML
const todoInput = document.getElementById("todo-input");
const todoDate = document.getElementById("todo-date");
const btnAdd = document.getElementById("btn-add");
const btnDeleteAll = document.getElementById("btn-delete-all");

const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const filterSelect = document.getElementById("filter-select");

const tbody = document.getElementById("todo-tbody");

const statTotal = document.getElementById("stat-total");
const statDone = document.getElementById("stat-done");
const statPending = document.getElementById("stat-pending");
const statOverdue = document.getElementById("stat-overdue");
const statProgress = document.getElementById("stat-progress");
const progressFill = document.getElementById("progress-fill");

// Bagian progress (wrapper di HTML harus ada id="progress-section")
const progressSection = document.getElementById("progress-section");

// Modal untuk edit todo
const editModal = document.getElementById("edit-modal");
const editTaskInput = document.getElementById("edit-task");
const editDateInput = document.getElementById("edit-date");
const btnEditClose = document.getElementById("btn-edit-close");
const btnEditCancel = document.getElementById("btn-edit-cancel");
const btnEditSave = document.getElementById("btn-edit-save");

let editingId = null;

// Fungsi bantu
function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Format todo.date: YYYY-MM-DD
function isOverdue(todo) {
  if (todo.done) return false;
  if (!todo.date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(todo.date);
  due.setHours(0, 0, 0, 0);

  return due < today;
}

// Fitur utama todo (tambah/ubah/hapus)
function addTodo() {
  const task = todoInput.value.trim();
  const date = todoDate.value;

  if (task === "" || date === "") {
    alert("Mohon lengkapi Task dan Tanggal yang diperlukan.");
    return;
  }

  const newTodo = {
    id: makeId(),
    task,
    date,
    done: false,
    createdAt: Date.now(),
  };

  todos.unshift(newTodo);

  todoInput.value = "";
  todoDate.value = "";
  todoInput.focus();

  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  renderTodos();
}

function removeAllTodo() {
  const ok = confirm("Delete all todos?");
  if (!ok) return;
  todos = [];
  renderTodos();
}

// Edit dan simpan perubahan
function openEditModal(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  editingId = id;
  editTaskInput.value = todo.task;
  editDateInput.value = todo.date;

  editModal.classList.remove("hidden");
  editModal.classList.add("flex");

  setTimeout(() => editTaskInput.focus(), 0);
}

function closeEditModal() {
  editingId = null;
  editTaskInput.value = "";
  editDateInput.value = "";

  editModal.classList.add("hidden");
  editModal.classList.remove("flex");
}

function saveEdit() {
  // rapi: strict check
  if (editingId === null) return;

  const newTask = editTaskInput.value.trim();
  const newDate = editDateInput.value;

  if (newTask === "" || newDate === "") {
    alert("Mohon lengkapi Task dan Tanggal yang diperlukan.");
    return;
  }

  todos = todos.map((t) => {
    if (t.id !== editingId) return t;
    return { ...t, task: newTask, date: newDate };
  });

  closeEditModal();
  renderTodos();
}

// Pencarian, filter, dan pengurutan data
function searchTodo(list) {
  const q = (searchInput?.value || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((t) => t.task.toLowerCase().includes(q));
}

function filterTodo(list) {
  const mode = filterSelect?.value || "all";
  if (mode === "pending") return list.filter((t) => !t.done && !isOverdue(t));
  if (mode === "done") return list.filter((t) => t.done);
  if (mode === "overdue") return list.filter((t) => isOverdue(t));
  return list;
}

function sortTodo(list) {
  const mode = sortSelect?.value || "newest";
  const arr = [...list];

  if (mode === "oldest") arr.sort((a, b) => a.createdAt - b.createdAt);
  else if (mode === "newest") arr.sort((a, b) => b.createdAt - a.createdAt);
  else if (mode === "dueAsc")
    arr.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  else if (mode === "dueDesc")
    arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  else if (mode === "nameAsc") arr.sort((a, b) => a.task.localeCompare(b.task));
  else if (mode === "nameDesc") arr.sort((a, b) => b.task.localeCompare(a.task));

  return arr;
}

// Statistik dan progress
function updateStats() {
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const overdue = todos.filter((t) => isOverdue(t)).length;
  const pending = total - done - overdue;

  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent = total;
  statDone.textContent = done;
  statPending.textContent = pending;
  if (statOverdue) statOverdue.textContent = overdue;
  statProgress.textContent = progress;

  progressFill.style.width = progress + "%";

  // Sembunyikan progress bar kalau belum ada todo (biar strip abu-abu nggak kepanjangan)
  if (progressSection) {
    if (total === 0) progressSection.classList.add("hidden");
    else progressSection.classList.remove("hidden");
  }
}

// Tampilkan todo ke dalam tabel
function renderTodos() {
  let viewList = [...todos];
  viewList = searchTodo(viewList);
  viewList = filterTodo(viewList);
  viewList = sortTodo(viewList);

  tbody.innerHTML = "";

  if (viewList.length === 0) {
    tbody.innerHTML = `
      <tr id="empty-row">
        <td colspan="4" class="px-4 py-6 text-center text-slate-500">
          Belum ada todo. Tambahkan tugas pertama kamu 🙂
        </td>
      </tr>
    `;
    updateStats();
    return;
  }

  viewList.forEach((todo) => {
    // Urutan status: Completed > Overdue > Pending
    let statusText = "Pending";
    let statusClass = "bg-yellow-100 text-yellow-700";

    if (todo.done) {
      statusText = "Completed";
      statusClass = "bg-green-100 text-green-700";
    } else if (isOverdue(todo)) {
      statusText = "Overdue";
      statusClass = "bg-red-100 text-red-700";
    }

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="px-4 py-3">
        <span class="${todo.done ? "line-through text-slate-400" : ""}">
          ${escapeHtml(todo.task)}
        </span>
      </td>

      <td class="px-4 py-3">${todo.date}</td>

      <td class="px-4 py-3">
        <button
          type="button"
          class="rounded-full ${statusClass} px-3 py-1 text-xs font-semibold"
          data-action="toggle"
          data-id="${todo.id}"
          title="Click to toggle completion"
        >
          ${statusText}
        </button>
      </td>

      <td class="px-4 py-3 text-right">
        <div class="inline-flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            data-action="edit"
            data-id="${todo.id}"
          >
            Edit
          </button>

          <button
            type="button"
            class="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            data-action="delete"
            data-id="${todo.id}"
          >
            Delete
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateStats();
}

// Event listener
btnAdd.addEventListener("click", addTodo);

todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addTodo();
  }
});

btnDeleteAll.addEventListener("click", removeAllTodo);

searchInput?.addEventListener("input", renderTodos);
filterSelect?.addEventListener("change", renderTodos);
sortSelect?.addEventListener("change", renderTodos);

// Aksi di tabel: toggle, edit, delete
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "toggle") toggleTodo(id);
  if (action === "edit") openEditModal(id);
  if (action === "delete") deleteTodo(id);
});

// Tombol di modal edit
btnEditClose.addEventListener("click", closeEditModal);
btnEditCancel.addEventListener("click", closeEditModal);
btnEditSave.addEventListener("click", saveEdit);

// Tutup modal kalau klik area luar modal
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

// Tutup modal dengan ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !editModal.classList.contains("hidden")) {
    closeEditModal();
  }
});

// Render pertama kali saat halaman dibuka
renderTodos();
