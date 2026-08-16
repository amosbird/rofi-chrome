const $ = (selector) => document.querySelector(selector);
const enableButton = $("#enable-bookmarks");
const permissionPanel = $("#permission-panel");
const permissionStatus = $("#permission-status");
const main = $("main");
const input = $("#url-input");
const previewList = $("#preview-list");
const previewSummary = $("#preview-summary");
const captureResults = $("#capture-results");
const moveFolderSelect = $("#move-folder-select");
const searchInput = $("#search");
const bookmarkList = $("#bookmark-list");
const bookmarkCount = $("#bookmark-count");
const totalCount = $("#total-count");
const emptyBookmarks = $("#empty-bookmarks");
const libraryActions = $("#library-actions");
const selectionCount = $("#selection-count");
const addButton = $("#add-bookmarks");
const addStatus = $("#add-status");
const manageStatus = $("#manage-status");
const undoButton = $("#undo-add");
const formatHelpDialog = $("#format-help-dialog");
const editDialog = $("#edit-dialog");
const editTitle = $("#edit-title");
const editUrl = $("#edit-url");

let folders = [];
let bookmarks = [];
let previewItems = [];
let selectedIds = new Set();
let currentFolderId = "";
let editingId = "";
let undoCreatedIds = [];
let reloading = false;

function parseBookmarkOutline(text) {
    const items = [];
    const errors = [];
    const headingStack = [];
    let previousLevel = 1;
    let inComment = false;

    text.split(/\r?\n/).forEach((rawLine, index) => {
        let line = rawLine.trim();
        if (!line) return;
        if (inComment) {
            if (line.includes("-->")) inComment = false;
            return;
        }
        if (line.startsWith("<!--")) {
            inComment = !line.includes("-->");
            return;
        }
        const heading = line.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            const level = heading[1].length;
            const title = heading[2].trim();
            if (level === 1 && title.toLocaleLowerCase() === "bookmarks") {
                headingStack.length = 0;
                previousLevel = 1;
                return;
            }
            if (level < 2) {
                errors.push(`Line ${index + 1}: only # Bookmarks may use a level-one heading.`);
                return;
            }
            if (level > previousLevel + 1) {
                errors.push(`Line ${index + 1}: heading level jumps from ${previousLevel} to ${level}.`);
                return;
            }
            headingStack.length = level - 2;
            headingStack[level - 2] = title;
            previousLevel = level;
            return;
        }

        line = line.replace(/^[-*+]\s+/, "");
        const markdown = line.match(/^\[([^\]]+)]\((https?:\/\/[^)\s]+)\)$/);
        const titled = line.match(/^(.+?)\s+(https?:\/\/\S+)$/);
        const bare = line.match(/^(https?:\/\/\S+)$/);
        if (!markdown && !titled && !bare) {
            if (line.includes("http://") || line.includes("https://")) {
                errors.push(`Line ${index + 1}: use title URL, a Markdown link, or a bare URL.`);
            }
            return;
        }
        const url = markdown?.[2] || titled?.[2] || bare[1];
        try {
            const parsed = new URL(url);
            items.push({
                title: markdown?.[1] || titled?.[1] || parsed.hostname || url,
                url,
                folderPath: headingStack.filter(Boolean),
                line: index + 1,
            });
        } catch (_) {
            errors.push(`Line ${index + 1}: invalid URL.`);
        }
    });
    return { items, errors };
}

function parseUrls(text) {
    const outline = parseBookmarkOutline(text);
    if (outline.items.length || /^\s*#/m.test(text)) return outline;
    const result = [];
    const seen = new Set();
    const matches = text.matchAll(
        /\[([^\]]+)]\((https?:\/\/[^)\s]+)\)|^\s*(.+?)\s+(https?:\/\/\S+)\s*$|(https?:\/\/\S+)/gm,
    );
    for (const match of matches) {
        const title = match[1] || match[3] || "";
        const url = match[2] || match[4] || match[5];
        try {
            const parsed = new URL(url);
            if (!/^https?:$/.test(parsed.protocol) || seen.has(url)) continue;
            seen.add(url);
            result.push({ title: title || parsed.hostname || url, url, folderPath: [] });
        } catch (_) {
            // Ignore malformed input. No network access is performed.
        }
    }
    return { items: result, errors: [] };
}

function flattenTree(tree) {
    const nextFolders = [];
    const nextBookmarks = [];

    function walk(node, path, depth) {
        if (node.url) {
            nextBookmarks.push({
                id: node.id,
                parentId: node.parentId,
                title: node.title || node.url,
                url: node.url,
                path: path.join(" / "),
            });
            return;
        }
        const nextPath = node.title ? [...path, node.title] : path;
        if (node.parentId && node.unmodifiable !== "managed") {
            nextFolders.push({
                id: node.id,
                parentId: node.parentId,
                title: node.title || "(unnamed)",
                path: nextPath,
                depth,
            });
        }
        for (const child of node.children || []) walk(child, nextPath, depth + 1);
    }

    for (const root of tree) walk(root, [], -1);
    return { folders: nextFolders, bookmarks: nextBookmarks };
}

function fillFolderSelect(select, selectedId) {
    select.replaceChildren();
    for (const folder of folders) {
        const option = document.createElement("option");
        option.value = folder.id;
        option.textContent = folder.path.join(" / ");
        option.selected = folder.id === selectedId;
        select.append(option);
    }
}

function renderFolderTree() {
    const tree = $("#folder-tree");
    tree.replaceChildren();
    for (const folder of folders) {
        const button = document.createElement("button");
        button.className = "folder";
        button.dataset.folderId = folder.id;
        button.type = "button";
        button.title = folder.path.join(" / ");
        button.style.paddingLeft = `${12 + Math.max(0, folder.depth) * 14}px`;
        button.textContent = folder.title;
        tree.append(button);
    }
}

function renderPreview() {
    const existing = new Set(bookmarks.map((bookmark) => bookmark.url));
    const parsed = parseUrls(input.value);
    previewItems = parsed.items.map((item) => ({
        ...item,
        duplicate: existing.has(item.url),
        selected: !existing.has(item.url),
    }));
    previewList.replaceChildren();
    let selected = 0;
    let duplicates = 0;

    previewItems.forEach((item, index) => {
        const row = document.createElement("div");
        row.className = `preview-row${item.duplicate ? " duplicate" : ""}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = item.selected;
        checkbox.disabled = item.duplicate;
        checkbox.addEventListener("change", () => {
            item.selected = checkbox.checked;
            renderPreviewSummary();
        });
        const title = document.createElement("input");
        title.type = "text";
        title.value = item.title;
        title.setAttribute("aria-label", `Title for URL ${index + 1}`);
        title.addEventListener("input", () => {
            item.title = title.value;
        });
        const url = document.createElement("span");
        url.className = "url";
        url.textContent = item.url;
        const state = document.createElement("span");
        state.className = "badge";
        const folder = item.folderPath.join(" / ");
        state.textContent = `${item.duplicate ? "Duplicate" : "New"}${folder ? ` · ${folder}` : ""}`;
        row.append(checkbox, title, url, state);
        previewList.append(row);
        if (item.selected) selected++;
        if (item.duplicate) duplicates++;
    });
    captureResults.hidden = !input.value.trim();
    previewList.hidden = previewItems.length === 0;
    renderPreviewSummary(selected, duplicates, parsed.errors);
}

function renderPreviewSummary(selected, duplicates, errors = []) {
    if (selected === undefined) {
        selected = previewItems.filter((item) => item.selected).length;
        duplicates = previewItems.filter((item) => item.duplicate).length;
    }
    previewSummary.textContent = errors.length
        ? `Format error: ${errors.join(" ")}`
        : previewItems.length
          ? `${selected} ready · ${new Set(previewItems.map((item) => item.folderPath.join("/"))).size} folder path(s) · ${duplicates} duplicate(s)`
          : "Paste URLs to preview them.";
    addButton.disabled = selected === 0 || errors.length > 0;
    addButton.firstChild.textContent = `Add ${selected} bookmark${selected === 1 ? "" : "s"} `;
}

function visibleBookmarks() {
    const tokens = searchInput.value.toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return bookmarks.filter((bookmark) => {
        const folderMatches = !currentFolderId || bookmark.parentId === currentFolderId;
        const haystack = `${bookmark.title} ${bookmark.url} ${bookmark.path}`.toLocaleLowerCase();
        return folderMatches && tokens.every((token) => haystack.includes(token));
    });
}

function renderSelection() {
    const count = selectedIds.size;
    libraryActions.hidden = count === 0;
    selectionCount.textContent = `${count} selected`;
    $("#edit-selected").disabled = count !== 1;
    document.querySelectorAll(".bookmark-row").forEach((row) => {
        row.classList.toggle("selected", selectedIds.has(row.dataset.id));
        row.querySelector("input").checked = selectedIds.has(row.dataset.id);
    });
}

function renderBookmarks() {
    const visible = visibleBookmarks();
    bookmarkList.replaceChildren();
    for (const bookmark of visible) {
        const row = document.createElement("div");
        row.className = "bookmark-row";
        row.dataset.id = bookmark.id;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedIds.has(bookmark.id);
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) selectedIds.add(bookmark.id);
            else selectedIds.delete(bookmark.id);
            renderSelection();
        });
        const title = document.createElement("a");
        title.href = bookmark.url;
        title.textContent = bookmark.title;
        title.addEventListener("click", async (event) => {
            event.preventDefault();
            await openInBrowser(bookmark.url);
        });
        const url = document.createElement("span");
        url.className = "url";
        url.textContent = bookmark.url;
        const path = document.createElement("span");
        path.className = "path";
        path.textContent = bookmark.path;
        row.append(checkbox, title, url, path);
        bookmarkList.append(row);
    }
    bookmarkCount.textContent = `${visible.length} of ${bookmarks.length}`;
    totalCount.textContent = `${bookmarks.length} saved`;
    emptyBookmarks.hidden = visible.length !== 0;
    renderSelection();
}

async function reload() {
    if (reloading) return;
    reloading = true;
    try {
        const selectedMoveFolder = moveFolderSelect.value;
        const tree = await chrome.bookmarks.getTree();
        ({ folders, bookmarks } = flattenTree(tree));
        fillFolderSelect(moveFolderSelect, selectedMoveFolder);
        renderFolderTree();
        renderPreview();
        renderBookmarks();
    } finally {
        reloading = false;
    }
}

async function showManager() {
    permissionPanel.hidden = true;
    main.hidden = false;
    await reload();
    input.focus();
}

async function requestPermission() {
    permissionStatus.textContent = "Waiting for Chromium permission…";
    const granted = await chrome.permissions.request({ permissions: ["bookmarks"] });
    if (!granted) {
        permissionStatus.textContent = "Bookmark access was not granted.";
        return;
    }
    await showManager();
}

async function initialize() {
    if (await chrome.permissions.contains({ permissions: ["bookmarks"] })) await showManager();
}

async function defaultBookmarkParent() {
    const root = (await chrome.bookmarks.getTree())[0];
    const other = (root.children || []).find((folder) => folder.folderType === "other");
    return other?.id;
}

async function ensureFolderPath(parentId, folderPath, folderCache) {
    let currentParent = parentId;
    for (const title of folderPath) {
        const key = `${currentParent}\u0000${title}`;
        let folderId = folderCache.get(key);
        if (!folderId) {
            const created = await chrome.bookmarks.create({ parentId: currentParent, title });
            folderId = created.id;
            folderCache.set(key, folderId);
            undoCreatedIds.push(folderId);
        }
        currentParent = folderId;
    }
    return currentParent;
}

async function addBookmarks() {
    const items = previewItems.filter((item) => item.selected);
    if (!items.length) return;
    undoCreatedIds = [];
    const defaultParent = await defaultBookmarkParent();
    const folderCache = new Map(
        folders.map((folder) => [`${folder.parentId}\u0000${folder.title}`, folder.id]),
    );
    for (const item of items) {
        const parentId = await ensureFolderPath(defaultParent, item.folderPath, folderCache);
        const created = await chrome.bookmarks.create({
            parentId,
            title: item.title || item.url,
            url: item.url,
        });
        undoCreatedIds.push(created.id);
    }
    addStatus.textContent = `Added ${items.length} bookmark(s) to Chromium's default folder.`;
    undoButton.hidden = false;
    input.value = "";
    await reload();
}

async function openInBrowser(url) {
    await chrome.runtime.sendNativeMessage("io.github.amosbird.rofi.chrome", {
        info: "openInBrowser",
        param: { url },
    });
}

function selectedBookmarks() {
    return bookmarks.filter((bookmark) => selectedIds.has(bookmark.id));
}

function selectFolder(id) {
    currentFolderId = id;
    selectedIds.clear();
    document.querySelectorAll(".folder").forEach((button) => {
        button.classList.toggle("active", button.dataset.folderId === id);
    });
    renderBookmarks();
}

enableButton.addEventListener("click", requestPermission);
input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
    renderPreview();
});
searchInput.addEventListener("input", renderBookmarks);
addButton.addEventListener("click", addBookmarks);

$("#show-format-help").addEventListener("click", () => formatHelpDialog.showModal());

undoButton.addEventListener("click", async () => {
    for (const id of [...undoCreatedIds].reverse()) {
        try {
            await chrome.bookmarks.remove(id);
        } catch (_) {
            // Ignore entries already removed elsewhere.
        }
    }
    addStatus.textContent = `Removed ${undoCreatedIds.length} recently added bookmark(s).`;
    undoCreatedIds = [];
    undoButton.hidden = true;
    await reload();
});

$("#folder-tree").addEventListener("click", (event) => {
    const button = event.target.closest(".folder");
    if (button) selectFolder(button.dataset.folderId);
});

document
    .querySelector('aside > [data-folder-id=""]')
    .addEventListener("click", () => selectFolder(""));

$("#open-selected").addEventListener("click", async () => {
    for (const bookmark of selectedBookmarks()) await openInBrowser(bookmark.url);
});

$("#edit-selected").addEventListener("click", () => {
    const bookmark = selectedBookmarks()[0];
    if (!bookmark) return;
    editingId = bookmark.id;
    editTitle.value = bookmark.title;
    editUrl.value = bookmark.url;
    editDialog.showModal();
    editTitle.focus();
});

$("#save-edit").addEventListener("click", async (event) => {
    event.preventDefault();
    await chrome.bookmarks.update(editingId, { title: editTitle.value, url: editUrl.value });
    editDialog.close();
    await reload();
});

$("#move-selected").addEventListener("click", async () => {
    for (const id of selectedIds) {
        await chrome.bookmarks.move(id, { parentId: moveFolderSelect.value });
    }
    manageStatus.textContent = `Moved ${selectedIds.size} bookmark(s).`;
    selectedIds.clear();
    await reload();
});

$("#delete-selected").addEventListener("click", async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size} bookmark(s)?`)) return;
    const count = selectedIds.size;
    for (const id of selectedIds) await chrome.bookmarks.remove(id);
    selectedIds.clear();
    manageStatus.textContent = `Deleted ${count} bookmark(s).`;
    await reload();
});

function onBookmarkChanged() {
    if (!reloading) reload();
}
chrome.bookmarks.onCreated.addListener(onBookmarkChanged);
chrome.bookmarks.onChanged.addListener(onBookmarkChanged);
chrome.bookmarks.onMoved.addListener(onBookmarkChanged);
chrome.bookmarks.onRemoved.addListener(onBookmarkChanged);

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "1") {
        event.preventDefault();
        input.focus();
    } else if (event.ctrlKey && event.key === "2") {
        event.preventDefault();
        searchInput.focus();
    } else if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        addBookmarks();
    } else if (event.key === "/" && !event.target.matches("input, textarea")) {
        event.preventDefault();
        searchInput.focus();
    } else if (event.key === "Escape") {
        if (document.activeElement === input && input.value) {
            input.value = "";
            renderPreview();
        } else if (document.activeElement === searchInput && searchInput.value) {
            searchInput.value = "";
            renderBookmarks();
        } else {
            selectedIds.clear();
            renderSelection();
        }
    }
});

initialize();
