import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";

export interface NotepadDocument {
    path: string;
    content: string;
}

export function openDocument(
    fileSystem: VirtualFileSystem,
    path: string,
): NotepadDocument {
    const node = fileSystem.stat(path);

    if (node.type !== "file") {
        throw new Error("파일만 열 수 있습니다.");
    }

    return {
        path,
        content: fileSystem.readFile(path),
    };
}

export function saveDocument(
    fileSystem: VirtualFileSystem,
    path: string,
    content: string,
): NotepadDocument {
    const target = path.trim();

    if (!target) {
        throw new Error("저장 경로를 입력해 주세요.");
    }

    if (fileSystem.exists(target)) {
        const node = fileSystem.stat(target);

        if (node.type !== "file") {
            throw new Error("파일이 아닌 경로입니다.");
        }

        fileSystem.writeFile(target, content);
    } else {
        fileSystem.createFile(target, content);
    }

    return {
        path: target,
        content,
    };
}
