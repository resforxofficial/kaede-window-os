export type FsNodeType = "directory" | "file";

export interface FsBaseNode {
    id: string;
    name: string;
    parentId: string | null;

    createdAt: number;
    updatedAt: number;
}

export interface FsDirectory extends FsBaseNode {
    type: "directory";
    children: string[];
}

export interface FsFile extends FsBaseNode {
    type: "file";
    content: string;
}

export type FsNode = FsDirectory | FsFile;
