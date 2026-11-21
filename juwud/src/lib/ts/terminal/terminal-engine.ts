import type { FsNode } from "#lib/types/filetype.ts";
import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";

export interface TerminalContext {
    fileSystem: VirtualFileSystem;
    cwd: string;
}

export interface CommandResult {
    output: string[];
    cwd: string;
    clear?: boolean;
}

// -------------------------
// Command Parser
// -------------------------

function tokenize(input: string): string[] {
    const tokens: string[] = [];

    let current = "";
    let quoted = false;
    let active = false;

    for (const char of input) {
        if (char === '"') {
            quoted = !quoted;
            active = true;
            continue;
        }

        if (/\s/.test(char) && !quoted) {
            if (active) {
                tokens.push(current);
                current = "";
                active = false;
            }

            continue;
        }

        current += char;
        active = true;
    }

    if (quoted) {
        throw new Error("닫히지 않은 큰따옴표가 있습니다.");
    }

    if (active) {
        tokens.push(current);
    }

    return tokens;
}

// -------------------------
// Path Resolver
// -------------------------

function resolvePath(path: string, cwd: string): string {
    const normalized = path.replaceAll("/", "\\");
    const driveMatch = normalized.match(/^([a-zA-Z]):/);
    let segments: string[];

    if (driveMatch) {
        if (driveMatch[1].toUpperCase() !== "C") {
            throw new Error("지원하지 않는 드라이브입니다.");
        }

        segments = [];
        if (normalized.startsWith("C:") || normalized.startsWith("c:")) {
            // 드라이브 경로는 C:\ 기준으로 처리
        }
    } else if (normalized.startsWith("\\")) {
        segments = [];
    } else {
        segments = cwd.slice(3).split("\\").filter(Boolean);
    }

    const remaining = driveMatch ? normalized.slice(2) : normalized;
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

function joinPath(parent: string, name: string): string {
    return parent === "C:\\" ? `${parent}${name}` : `${parent}\\${name}`;
}

// -------------------------
// Command Helpers
// -------------------------

function getDirectory(fileSystem: VirtualFileSystem, path: string): FsNode[] {
    const node = fileSystem.stat(path);

    if (node.type !== "directory") {
        throw new Error("디렉터리가 아닙니다.");
    }

    return fileSystem.list(path);
}

function formatDirectory(path: string, nodes: FsNode[]): string[] {
    const lines = ["", ` ${path} 디렉터리`, ""];

    let directoryCount = 0;
    let fileCount = 0;

    for (const node of nodes) {
        if (node.type === "directory") {
            directoryCount++;
            lines.push(` <DIR>          ${node.name}`);
        } else {
            fileCount++;
            lines.push(` ${String(node.content.length).padStart(14)} ${node.name}`);
        }
    }

    lines.push("");
    lines.push(` 디렉터리 ${directoryCount}개, 파일 ${fileCount}개`);

    return lines;
}

// -------------------------
// Commands
// -------------------------

export function executeCommand(
    input: string,
    context: TerminalContext,
): CommandResult {
    const { fileSystem } = context;
    let { cwd } = context;
    const result = (output: string[] = [], clear = false): CommandResult => ({
        output,
        cwd,
        clear,
    });

    try {
        const tokens = tokenize(input.trim());

        if (tokens.length === 0) {
            return result();
        }

        const command = tokens[0].toLowerCase();
        const args = tokens.slice(1);

        switch (command) {
            // -------------------------
            // Help
            // -------------------------

            case "help": {
                return result([
                    "",
                    "tripleS OS Command Processor",
                    "",
                    "사용 가능한 명령어:",
                    "",
                    " HELP              명령어 목록 표시",
                    " CLS               터미널 화면 지우기",
                    " DIR [경로]         파일 및 폴더 목록",
                    " TREE [경로] [/F]   폴더 구조 표시",
                    " CD [경로]          현재 디렉터리 변경",
                    " MKDIR <경로>       폴더 생성",
                    " RMDIR <경로> [/S]  폴더 삭제",
                    " ECHO <텍스트>      텍스트 출력",
                    " TYPE <파일>        파일 내용 표시",
                    " VER               OS 버전 표시",
                    "",
                    "경로에 공백이 있는 경우 큰따옴표를 사용하세요.",
                    '예: cd "My Documents"',
                    "",
                ]);
            }

            // -------------------------
            // Clear
            // -------------------------

            case "cls": {
                return result([], true);
            }

            // -------------------------
            // Version
            // -------------------------

            case "ver": {
                return result([
                    "",
                    "tripleS OS [Version 1.0.0]",
                    "Virtual Command Processor",
                    "",
                ]);
            }

            // -------------------------
            // Directory
            // -------------------------

            case "dir": {
                const target = args[0] ?? cwd;
                const absolute = resolvePath(target, cwd);

                const nodes = getDirectory(fileSystem, absolute);

                return result(formatDirectory(absolute, nodes));
            }

            // -------------------------
            // Tree
            // -------------------------

            case "tree": {
                const includeFiles = args.some((arg) => arg.toLowerCase() === "/f");
                const target = args.find((arg) => !arg.startsWith("/")) ?? cwd;
                const absolute = resolvePath(target, cwd);
                const root = fileSystem.stat(absolute);

                if (root.type !== "directory") {
                    throw new Error("디렉터리가 아닙니다.");
                }

                const lines = ["", absolute];
                let visited = 0;

                function walk(
                    currentPath: string,
                    prefix: string,
                    depth: number,
                ): void {
                    if (depth > 32) return;

                    const children = fileSystem.list(currentPath);
                    const visible = includeFiles
                        ? children
                        : children.filter((node) => node.type === "directory");

                    visible.forEach((node, index) => {
                        if (++visited > 1000) {
                            lines.push(`${prefix}... (출력 제한)`);
                            return;
                        }

                        const last = index === visible.length - 1;
                        const branch = last ? "└── " : "├── ";

                        const suffix = node.type === "directory" ? "\\" : "";
                        lines.push(`${prefix}${branch}${node.name}${suffix}`);

                        if (node.type === "directory") {
                            const nextPrefix = prefix + (last ? "    " : "│   ");

                            walk(joinPath(currentPath, node.name), nextPrefix, depth + 1);
                        }
                    });
                }

                walk(absolute, "", 0);
                lines.push("");
                lines.push("폴더 트리 출력 완료.");

                return result(lines);
            }

            // -------------------------
            // Change Directory
            // -------------------------

            case "cd": {
                const pathArgs = args.filter((arg) => arg.toLowerCase() !== "/d");

                if (pathArgs.length === 0) {
                    return result([cwd]);
                }

                const absolute = resolvePath(pathArgs[0], cwd);
                const node = fileSystem.stat(absolute);

                if (node.type !== "directory") {
                    throw new Error("디렉터리가 아닙니다.");
                }

                cwd = absolute;
                return result();
            }

            // -------------------------
            // Make Directory
            // -------------------------

            case "mkdir":
            case "md": {
                const pathArgs = args.filter((arg) => arg.toLowerCase() !== "/p");

                if (!pathArgs[0]) {
                    throw new Error("사용법: mkdir <경로>");
                }

                const absolute = resolvePath(pathArgs[0], cwd);
                fileSystem.mkdir(absolute, cwd, true);
                return result([`디렉터리를 만들었습니다: ${absolute}`]);
            }

            // -------------------------
            // Remove Directory
            // -------------------------

            case "rmdir":
            case "rd": {
                const recursive = args.some((arg) => arg.toLowerCase() === "/s");
                const quiet = args.some((arg) => arg.toLowerCase() === "/q");
                const pathArgs = args.filter((arg) => !arg.startsWith("/"));

                if (!pathArgs[0]) {
                    throw new Error("사용법: rmdir <경로> [/s] [/q]");
                }

                const absolute = resolvePath(pathArgs[0], cwd);
                fileSystem.rmdir(absolute, cwd, recursive);
                return result(quiet ? [] : [`디렉터리를 삭제했습니다: ${absolute}`]);
            }

            // -------------------------
            // Echo
            // -------------------------

            case "echo": {
                return result([args.length > 0 ? args.join(" ") : "ECHO is on."]);
            }

            // -------------------------
            // Type
            // -------------------------

            case "type": {
                if (!args[0]) {
                    throw new Error("사용법: type <파일>");
                }

                const content = fileSystem.readFile(args[0], cwd);
                return result(content === "" ? [""] : content.split(/\r?\n/));
            }

            // -------------------------
            // Unknown Command
            // -------------------------

            default: {
                throw new Error(
                    `'${command}'은(는) 내부 또는 외부 명령으로 인식되지 않습니다.`,
                );
            }
        }
    } catch (error) {
        return result([
            error instanceof Error
                ? error.message
                : "알 수 없는 오류가 발생했습니다.",
        ]);
    }
}
