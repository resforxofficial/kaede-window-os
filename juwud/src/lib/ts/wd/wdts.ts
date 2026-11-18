type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type DragState = {
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
};

import { type WindowRect } from '#lib/types/oscore.ts';

type ResizeState = {
    pointerId: number;
    direction: ResizeDirection;
    startX: number;
    startY: number;
    origin: WindowRect;
};

export type { ResizeDirection, DragState, ResizeState };
