import type { FsDirectory, FsFile, FsNode } from "#lib/types/filetype.ts";

const STORAGE_KEY = "tripleS-os:filesystem:v1";
const ROOT_ID = "root";

function createDefaultNodes(): Record<string, FsNode> {
    const now = Date.now();

    const nodes: Record<string, FsNode> = {
        root: {
            id: "root",
            name: "C:",
            type: "directory",
            parentId: null,
            children: [],
            createdAt: now,
            updatedAt: now,
        },
    };

    function addDirectory(id: string, name: string, parentId: string) {
        const directory: FsDirectory = {
            id,
            name,
            type: "directory",
            parentId,
            children: [],
            createdAt: now,
            updatedAt: now,
        };

        nodes[id] = directory;

        const parent = nodes[parentId];

        if (parent?.type === "directory") {
            parent.children.push(id);
        }
    }

    addDirectory("users", "Users", "root");
    addDirectory("programs", "Programs", "root");
    addDirectory("members", "Members", "root");
    addDirectory("recycle-bin", "Recycle Bin", "root");

    addDirectory("guest", "Guest", "users");

    addDirectory("desktop", "Desktop", "guest");
    addDirectory("documents", "Documents", "guest");
    addDirectory("pictures", "Pictures", "guest");
    addDirectory("music", "Music", "guest");

    return nodes;
}

function cloneNode(node: FsNode): FsNode {
    if (node.type === "directory") {
        return {
            ...node,
            children: [...node.children],
        };
    }

    return { ...node };
}

function isValidNodeMap(value: unknown): value is Record<string, FsNode> {
    if (!value || typeof value !== "object") return false;
    const root = (value as Record<string, unknown>)[ROOT_ID];
    if (!root || typeof root !== "object") return false;

    const node = root as Partial<FsDirectory>;

    return (
        node.type === "directory" &&
        node.id === ROOT_ID &&
        Array.isArray(node.children)
    );
}

export class VirtualFileSystem {
    #nodes = $state<Record<string, FsNode>>(createDefaultNodes());

    #createId(): string {
        if (
            typeof globalThis.crypto !== "undefined" &&
            typeof globalThis.crypto.randomUUID === "function"
        ) {
            return globalThis.crypto.randomUUID();
        }

        return `node-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    initialize(): void {
        if (typeof window === "undefined") return;

        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed: unknown = JSON.parse(raw);

            if (!isValidNodeMap(parsed)) {
                throw new Error("잘못된 파일 시스템 데이터입니다.");
            }

            this.#nodes = parsed;
        } catch (error) {
            console.error("VFS initialization failed:", error);
        }
    }

    #persist(): void {
        if (typeof window === "undefined") return;

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#nodes));
        } catch (error) {
            console.error("VFS persistence failed:", error);
            throw new Error("파일 시스템 저장에 실패했습니다.");
        }
    }

    // -------------------------
    // Path Management
    // -------------------------

    #resolveSegments(path: string, cwd = "C:\\"): string[] {
        const normalized = path.trim().replaceAll("/", "\\");

        if (!normalized) {
            throw new Error("경로를 입력해 주세요.");
        }
        const drive = normalized.match(/^([a-zA-Z]):/);

        if (drive && drive[1].toUpperCase() !== "C") {
            throw new Error("지원하지 않는 드라이브입니다.");
        }

        const absolute = normalized.startsWith("\\") || drive !== null;
        const combined = absolute
            ? normalized.replace(/^[a-zA-Z]:/, "")
            : `${cwd}\\${normalized}`;

        const segments: string[] = [];
        for (const segment of combined.split("\\")) {
            if (!segment || segment === ".") continue;

            if (segment === "..") {
                segments.pop();
                continue;
            }

            segments.push(segment);
        }

        return segments;
    }

    #findNodeBySegments(segments: string[]): FsNode | null {
        let current = this.#nodes[ROOT_ID];

        if (!current || current.type !== "directory") {
            return null;
        }

        for (const segment of segments) {
            if (current.type !== "directory") return null;

            const childId: string | undefined = current.children.find(
                (id: string): boolean => {
                    const child: FsNode | undefined = this.#nodes[id];

                    return (
                        child?.name.toLocaleLowerCase() === segment.toLocaleLowerCase()
                    );
                },
            );

            if (!childId) return null;
            const child: FsNode | undefined = this.#nodes[childId];
            if (!child) return null;

            current = child;
        }

        return current;
    }

    #findNode(path: string, cwd = "C:\\"): FsNode | null {
        return this.#findNodeBySegments(this.#resolveSegments(path, cwd));
    }

    #getParentAndName(path: string, cwd = "C:\\") {
        const segments = this.#resolveSegments(path, cwd);

        if (segments.length === 0) {
            throw new Error("루트 디렉터리는 변경할 수 없습니다.");
        }

        const name = segments.pop()!;
        const parent = this.#findNodeBySegments(segments);

        if (!parent || parent.type !== "directory") {
            throw new Error("상위 디렉터리를 찾을 수 없습니다.");
        }

        return { parent, name };
    }

    #validateName(name: string): void {
        if (!name.trim()) {
            throw new Error("파일 이름이 비어 있습니다.");
        }

        if (name === "." || name === "..") {
            throw new Error("사용할 수 없는 파일 이름입니다.");
        }

        if (/[<>:"/\\|?*\u0000-\u001f]/.test(name)) {
            throw new Error("파일 이름에 사용할 수 없는 문자가 있습니다.");
        }
    }

    #findChild(directory: FsDirectory, name: string): FsNode | null {
        const id = directory.children.find((childId) => {
            const child = this.#nodes[childId];

            return child?.name.toLocaleLowerCase() === name.toLocaleLowerCase();
        });

        return id ? (this.#nodes[id] ?? null) : null;
    }

    // -------------------------
    // Query
    // -------------------------

    exists(path: string, cwd = "C:\\"): boolean {
        try {
            return this.#findNode(path, cwd) !== null;
        } catch {
            return false;
        }
    }

    stat(path: string, cwd = "C:\\"): FsNode {
        const node = this.#findNode(path, cwd);

        if (!node) {
            throw new Error("파일 또는 디렉터리를 찾을 수 없습니다.");
        }

        return cloneNode(node);
    }

    list(path = "C:\\", cwd = "C:\\"): FsNode[] {
        const node = this.#findNode(path, cwd);

        if (!node) {
            throw new Error("디렉터리를 찾을 수 없습니다.");
        }

        if (node.type !== "directory") {
            throw new Error("디렉터리가 아닙니다.");
        }

        return node.children
            .map((id) => this.#nodes[id])
            .filter((child): child is FsNode => child !== undefined)
            .sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "directory" ? -1 : 1;
                }

                return a.name.localeCompare(b.name, "ko");
            })
            .map(cloneNode);
    }

    // -------------------------
    // Directory
    // -------------------------

    mkdir(path: string, cwd = "C:\\", recursive = false): FsDirectory {
        const segments = this.#resolveSegments(path, cwd);

        if (segments.length === 0) {
            throw new Error("루트 디렉터리는 이미 존재합니다.");
        }

        let current = this.#nodes[ROOT_ID];

        if (!current || current.type !== "directory") {
            throw new Error("루트 디렉터리가 손상되었습니다.");
        }

        for (let index = 0; index < segments.length; index++) {
            const name = segments[index];

            this.#validateName(name);

            const existing = this.#findChild(current, name);
            const isLast = index === segments.length - 1;

            if (existing) {
                if (existing.type !== "directory") {
                    throw new Error(`${name}은(는) 파일입니다.`);
                }

                if (isLast) {
                    throw new Error("이미 존재하는 디렉터리입니다.");
                }

                if (!recursive && index !== segments.length - 2) {
                    // 부모가 없는 경로를 임의로 만들지 않는다.
                    // 다음 반복에서 기존 디렉터리 여부를 확인한다.
                }

                current = existing;
                continue;
            }

            if (!recursive && !isLast) {
                throw new Error("상위 디렉터리가 존재하지 않습니다.");
            }

            const now = Date.now();

            const directory: FsDirectory = {
                id: this.#createId(),
                name,
                type: "directory",
                parentId: current.id,
                children: [],
                createdAt: now,
                updatedAt: now,
            };

            this.#nodes[directory.id] = directory;
            current.children.push(directory.id);
            current.updatedAt = now;

            current = directory;
        }

        this.#persist();
        return cloneNode(current) as FsDirectory;
    }

    rmdir(path: string, cwd = "C:\\", recursive = false): void {
        const { parent, name } = this.#getParentAndName(path, cwd);
        const target = this.#findChild(parent, name);

        if (!target) {
            throw new Error("디렉터리를 찾을 수 없습니다.");
        }

        if (target.type !== "directory") {
            throw new Error("디렉터리가 아닙니다.");
        }

        if (target.children.length > 0 && !recursive) {
            throw new Error("디렉터리가 비어 있지 않습니다.");
        }

        const removeTree = (directory: FsDirectory) => {
            for (const childId of directory.children) {
                const child = this.#nodes[childId];

                if (!child) continue;

                if (child.type === "directory") {
                    removeTree(child);
                }

                delete this.#nodes[childId];
            }

            directory.children = [];
        };
        removeTree(target);

        parent.children = parent.children.filter((id) => id !== target.id);

        parent.updatedAt = Date.now();
        delete this.#nodes[target.id];
        this.#persist();
    }

    // -------------------------
    // Files
    // -------------------------

    createFile(path: string, content = "", cwd = "C:\\"): FsFile {
        const { parent, name } = this.#getParentAndName(path, cwd);
        this.#validateName(name);

        if (this.#findChild(parent, name)) {
            throw new Error("이미 존재하는 항목입니다.");
        }
        const now = Date.now();

        const file: FsFile = {
            id: this.#createId(),
            name,
            type: "file",
            parentId: parent.id,
            content,
            createdAt: now,
            updatedAt: now,
        };

        this.#nodes[file.id] = file;
        parent.children.push(file.id);
        parent.updatedAt = now;

        this.#persist();
        return cloneNode(file) as FsFile;
    }

    readFile(path: string, cwd = "C:\\"): string {
        const node = this.#findNode(path, cwd);

        if (!node) {
            throw new Error("파일을 찾을 수 없습니다.");
        }

        if (node.type !== "file") {
            throw new Error("디렉터리는 읽을 수 없습니다.");
        }

        return node.content;
    }

    writeFile(path: string, content: string, cwd = "C:\\"): void {
        const node = this.#findNode(path, cwd);

        if (!node) {
            throw new Error("파일을 찾을 수 없습니다.");
        }

        if (node.type !== "file") {
            throw new Error("디렉터리에는 내용을 작성할 수 없습니다.");
        }

        node.content = content;
        node.updatedAt = Date.now();
        this.#persist();
    }

    removeFile(path: string, cwd = "C:\\"): void {
        const { parent, name } = this.#getParentAndName(path, cwd);
        const target = this.#findChild(parent, name);

        if (!target) {
            throw new Error("파일을 찾을 수 없습니다.");
        }

        if (target.type !== "file") {
            throw new Error("파일이 아닙니다.");
        }

        parent.children = parent.children.filter((id) => id !== target.id);

        parent.updatedAt = Date.now();
        delete this.#nodes[target.id];
        this.#persist();
    }

    // -------------------------
    // Rename
    // -------------------------

    rename(path: string, newName: string, cwd = "C:\\"): void {
        this.#validateName(newName);

        const { parent, name } = this.#getParentAndName(path, cwd);
        const target = this.#findChild(parent, name);

        if (!target) {
            throw new Error("대상을 찾을 수 없습니다.");
        }

        const duplicate = this.#findChild(parent, newName);

        if (duplicate && duplicate.id !== target.id) {
            throw new Error("같은 이름의 항목이 이미 존재합니다.");
        }

        target.name = newName;
        target.updatedAt = Date.now();
        parent.updatedAt = Date.now();

        this.#persist();
    }
}
