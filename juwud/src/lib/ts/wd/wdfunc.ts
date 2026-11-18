import type { WindowState } from "#lib/types/oscore.ts";
import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";
import type {
    DragState,
    ResizeDirection,
    ResizeState,
} from "#lib/ts/wd/wdts.ts";

// -------------------------
// Window Drag
// -------------------------

function startDrag(
    event: PointerEvent,
    win: WindowState,
    manager: WindowManager,
    dragState: DragState | null,
): DragState | null {
    if (event.button !== 0 || win.isMaximized) return dragState;

    if (event.target instanceof Element && event.target.closest("button")) {
        return dragState;
    }

    event.preventDefault();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    return {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: win.rect.x,
        originY: win.rect.y,
    };
}

function moveDrag(
    event: PointerEvent,
    frameElement: HTMLElement | null,
    dragState: DragState | null,
    win: WindowState,
    manager: WindowManager,
): void {
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const bounds = getDesktopBounds(frameElement);
    if (!bounds) return;

    const nextX = dragState.originX + event.clientX - dragState.startX;
    const nextY = dragState.originY + event.clientY - dragState.startY;

    const maxX = Math.max(0, bounds.width - win.rect.width);
    const maxY = Math.max(0, bounds.height - win.rect.height);

    const x = clamp(nextX, 0, maxX);
    const y = clamp(nextY, 0, maxY);

    manager.moveWindow(win.id, x, y);
}

function endDrag(
    event: PointerEvent,
    dragState: DragState | null,
): DragState | null {
    if (!dragState || dragState.pointerId !== event.pointerId) {
        return dragState;
    }

    return null;
}

// -------------------------
// Window Resize
// -------------------------

function startResize(
    event: PointerEvent,
    direction: ResizeDirection,
    win: WindowState,
    manager: WindowManager,
    resizeState: ResizeState | null,
): ResizeState | null {
    if (event.button !== 0 || win.isMaximized) return resizeState;

    event.preventDefault();
    event.stopPropagation();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    return {
        pointerId: event.pointerId,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...win.rect },
    };
}

function moveResize(
    event: PointerEvent,
    frameElement: HTMLElement | null,
    resizeState: ResizeState | null,
    win: WindowState,
    manager: WindowManager,
): void {
    if (!resizeState || resizeState.pointerId !== event.pointerId) return;

    const bounds = getDesktopBounds(frameElement);
    if (!bounds) return;

    const { direction, origin } = resizeState;

    const dx = event.clientX - resizeState.startX;
    const dy = event.clientY - resizeState.startY;

    const minWidth = Math.min(win.minWidth, bounds.width);
    const minHeight = Math.min(win.minHeight, bounds.height);

    // 현재 창의 경계를 데스크톱 영역 안으로 제한
    let left = clamp(origin.x, 0, bounds.width - minWidth);
    let top = clamp(origin.y, 0, bounds.height - minHeight);

    let right = clamp(origin.x + origin.width, left + minWidth, bounds.width);

    let bottom = clamp(origin.y + origin.height, top + minHeight, bounds.height);

    // 동쪽
    if (direction.includes("e")) {
        right = clamp(origin.x + origin.width + dx, left + minWidth, bounds.width);
    }

    // 서쪽
    if (direction.includes("w")) {
        left = clamp(origin.x + dx, 0, right - minWidth);
    }

    // 남쪽
    if (direction.includes("s")) {
        bottom = clamp(
            origin.y + origin.height + dy,
            top + minHeight,
            bounds.height,
        );
    }

    // 북쪽
    if (direction.includes("n")) {
        top = clamp(origin.y + dy, 0, bottom - minHeight);
    }

    manager.resizeWindow(win.id, {
        x: left,
        y: top,
        width: right - left,
        height: bottom - top,
    });
}

function endResize(
    event: PointerEvent,
    resizeState: ResizeState | null,
): ResizeState | null {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return resizeState;
    }

    return null;
}

// -------------------------
// Window Controls
// -------------------------

function toggleMaximize(manager: WindowManager, win: WindowState): void {
    manager.toggleMaximizeWindow(win.id);
}

// -------------------------
// Helpers
// -------------------------

function getDesktopBounds(frameElement: HTMLElement | null) {
    const desktop = frameElement?.offsetParent;

    if (!(desktop instanceof HTMLElement)) return null;

    return {
        width: desktop.clientWidth,
        height: desktop.clientHeight,
    };
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

export {
    startDrag,
    moveDrag,
    endDrag,
    startResize,
    moveResize,
    endResize,
    toggleMaximize,
};
