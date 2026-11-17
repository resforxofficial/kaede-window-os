export interface WindowRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface WindowState {
    id: string;
    appId: string;
    title: string;

    rect: WindowRect;

    minWidth: number;
    minHeight: number;

    zIndex: number;

    isMinimized: boolean;
    isMaximized: boolean;
}

export interface OpenWindowOptions {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
}
