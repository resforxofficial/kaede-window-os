import type { FsNode } from "#lib/types/filetype.ts";
import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";

// -------------------------
// Types
// -------------------------

export type ExplorerDialogState =
    | { kind: "folder"; value: string }
    | { kind: "file"; value: string }
    | { kind: "rename"; value: string; target: FsNode };

export interface ExplorerState {
    currentPath: string;
    addressValue: string;

    items: FsNode[];
    selectedId: string | null;

    backHistory: string[];
    forwardHistory: string[];

    statusMessage: string;

    dialog: ExplorerDialogState | null;
    dialogError: string;
}

export const INITIAL_PATH = "C:\\Users\\Guest";

const TEXT_EXTENSIONS = [
    "txt",
    "md",
    "json",
    "log",
    "csv",
    "xml",
    "html",
    "css",
    "ts",
];

// -------------------------
// Initial State
// -------------------------

export function createExplorerState(): ExplorerState {
    return {
        currentPath: INITIAL_PATH,
        addressValue: INITIAL_PATH,

        items: [],
        selectedId: null,

        backHistory: [],
        forwardHistory: [],

        statusMessage: "",
        dialog: null,
        dialogError: "",
    };
}

// -------------------------
// Error
// -------------------------

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "작업을 수행하지 못했습니다.";
}

// -------------------------
// Path Helpers
// -------------------------

export function resolvePath(
    input: string,
    base: string = INITIAL_PATH,
): string {
    const normalized = input.trim().replaceAll("/", "\\");

    if (!normalized) return base;

    const drive = normalized.match(/^([a-zA-Z]):/);

    if (drive && drive[1].toUpperCase() !== "C") {
        throw new Error("지원하지 않는 드라이브입니다.");
    }

    const absolute = drive !== null || normalized.startsWith("\\");

    const segments = absolute ? [] : base.slice(3).split("\\").filter(Boolean);

    const remaining = drive ? normalized.slice(2) : normalized;

    for (const segment of remaining.split("\\")) {
        if (!segment || segment === ".") continue;

        if (segment === "..") {
            segments.pop();
            continue;
        }

        segments.push(segment);
    }

    return segments.length ? `C:\\${segments.join("\\")}` : "C:\\";
}

export function joinPath(parent: string, name: string): string {
    return parent === "C:\\" ? `${parent}${name}` : `${parent}\\${name}`;
}

export function getParentPath(path: string): string {
    if (path === "C:\\") return path;

    const normalized = path.replace(/\\+$/, "");
    const index = normalized.lastIndexOf("\\");

    if (index <= 2) return "C:\\";

    return normalized.slice(0, index);
}

// -------------------------
// Selected Node
// -------------------------

export function getSelectedNode(state: ExplorerState): FsNode | null {
    return state.items.find((item) => item.id === state.selectedId) ?? null;
}

// -------------------------
// Directory
// -------------------------

export function refreshExplorer(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    try {
        state.items = fileSystem.list(state.currentPath);
        state.statusMessage = `항목 ${state.items.length}개`;
    } catch (error) {
        state.statusMessage = getErrorMessage(error);
    }
}

export function navigate(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
    input: string,
    recordHistory = true,
): void {
    try {
        const target = resolvePath(input, state.currentPath);
        const node = fileSystem.stat(target);

        if (node.type !== "directory") {
            throw new Error("폴더가 아닙니다.");
        }

        if (target !== state.currentPath && recordHistory) {
            state.backHistory = [...state.backHistory, state.currentPath];
            state.forwardHistory = [];
        }

        state.currentPath = target;
        state.addressValue = target;

        state.selectedId = null;

        refreshExplorer(state, fileSystem);
    } catch (error) {
        state.statusMessage = getErrorMessage(error);
        state.addressValue = state.currentPath;
    }
}

export function goBack(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    if (state.backHistory.length === 0) return;

    const target = state.backHistory[state.backHistory.length - 1];

    state.backHistory = state.backHistory.slice(0, -1);
    state.forwardHistory = [...state.forwardHistory, state.currentPath];

    navigate(state, fileSystem, target, false);
}

export function goForward(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    if (state.forwardHistory.length === 0) return;

    const target = state.forwardHistory[state.forwardHistory.length - 1];

    state.forwardHistory = state.forwardHistory.slice(0, -1);
    state.backHistory = [...state.backHistory, state.currentPath];

    navigate(state, fileSystem, target, false);
}

export function goUp(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    const parent = getParentPath(state.currentPath);

    if (parent !== state.currentPath) {
        navigate(state, fileSystem, parent);
    }
}

export function goHome(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    navigate(state, fileSystem, INITIAL_PATH);
}

export function initializeExplorer(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    if (!fileSystem.exists(state.currentPath)) {
        state.currentPath = "C:\\";
        state.addressValue = state.currentPath;
    }

    refreshExplorer(state, fileSystem);
}

// -------------------------
// File Helpers
// -------------------------

export function getExtension(name: string): string {
    const index = name.lastIndexOf(".");

    return index > 0 ? name.slice(index + 1).toLowerCase() : "";
}

export function getIcon(node: FsNode): string {
    if (node.type === "directory") return "📁";

    const icons: Record<string, string> = {
        txt: "📄",
        md: "📝",
        json: "📋",
        log: "📃",
        csv: "📊",
        xml: "📋",
        html: "🌐",
        css: "🎨",
        ts: "📜",
        png: "🖼️",
        jpg: "🖼️",
        jpeg: "🖼️",
        webp: "🖼️",
        mp3: "🎵",
        wav: "🎵",
    };

    return icons[getExtension(node.name)] ?? "📄";
}

// -------------------------
// Selection / Preview
// -------------------------

export function selectNode(state: ExplorerState, node: FsNode): void {
    state.selectedId = node.id;
}

export function openNode(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
    node: FsNode,
): void {
    if (node.type === "directory") {
        navigate(state, fileSystem, joinPath(state.currentPath, node.name));
        return;
    }

    selectNode(state, node);
    state.statusMessage = `${node.name} 선택됨`;
}

// -------------------------
// Dialog
// -------------------------

export function openDialog(
    state: ExplorerState,
    kind: "folder" | "file" | "rename",
): void {
    state.dialogError = "";

    if (kind === "rename") {
        const selected = getSelectedNode(state);

        if (!selected) return;

        state.dialog = {
            kind: "rename",
            value: selected.name,
            target: selected,
        };

        return;
    }

    state.dialog = {
        kind,
        value: "",
    };
}

export function closeDialog(state: ExplorerState): void {
    state.dialog = null;
    state.dialogError = "";
}

export function submitDialog(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
): void {
    const activeDialog = state.dialog;

    if (!activeDialog) return;

    const name = activeDialog.value.trim();

    if (!name) {
        state.dialogError = "이름을 입력해 주세요.";
        return;
    }

    try {
        if (activeDialog.kind === "folder") {
            fileSystem.mkdir(name, state.currentPath);
        } else if (activeDialog.kind === "file") {
            fileSystem.createFile(name, "", state.currentPath);
        } else {
            fileSystem.rename(activeDialog.target.name, name, state.currentPath);
        }

        closeDialog(state);

        state.selectedId = null;

        refreshExplorer(state, fileSystem);
    } catch (error) {
        state.dialogError = getErrorMessage(error);
    }
}

// -------------------------
// Delete
// -------------------------

export function deleteSelected(
    state: ExplorerState,
    fileSystem: VirtualFileSystem,
    confirmDelete: (message: string) => boolean,
): void {
    const node = getSelectedNode(state);

    if (!node) return;

    const confirmed = confirmDelete(`"${node.name}"을(를) 삭제하시겠습니까?`);

    if (!confirmed) return;

    try {
        if (node.type === "directory") {
            fileSystem.rmdir(node.name, state.currentPath);
        } else {
            fileSystem.removeFile(node.name, state.currentPath);
        }

        state.selectedId = null;

        refreshExplorer(state, fileSystem);
    } catch (error) {
        state.statusMessage = getErrorMessage(error);
    }
}
