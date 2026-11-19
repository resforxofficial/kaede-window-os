export type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
};

export type DesktopIconItem = {
    id: string;
    title: string;
    appId: string;
    icon: string;
    x: number;
    y: number;
};

export type ContextMenuState = {
    x: number;
    y: number;
    targetId: string | null;
};
