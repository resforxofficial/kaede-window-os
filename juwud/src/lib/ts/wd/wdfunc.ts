import type { WindowState } from "#lib/types/oscore.ts";
import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";
import type { DragState, ResizeDirection, ResizeState } from "#lib/ts/wd/wdts.ts";

function startDrag(event: PointerEvent, win: WindowState, manager: WindowManager, dragState: DragState | null) {
    if (event.button !== 0 || win.isMaximized) return;

    // 창 제어 버튼을 누른 경우 드래그하지 않는다.
    if (event.target instanceof Element && event.target.closest("button")) {
        return;
    }

    event.preventDefault();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);

    dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: win.rect.x,
        originY: win.rect.y,
    };
}

function moveDrag(event: PointerEvent, dragState: DragState | null, manager: WindowManager, win: WindowState) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
    }

    const x = dragState.originX + event.clientX - dragState.startX;

    const y = dragState.originY + event.clientY - dragState.startY;

    manager.moveWindow(win.id, x, y);
}

function endDrag(event: PointerEvent, dragState: DragState | null) {
    if (!dragState || dragState.pointerId !== event.pointerId) {
        return;
    }

    dragState = null;
}

// -------------------------
// Window Resize
// -------------------------

function startResize(event: PointerEvent, direction: ResizeDirection, win: WindowState, manager: WindowManager, resizeState: ResizeState | null) {
    if (event.button !== 0 || win.isMaximized) return;

    event.preventDefault();
    event.stopPropagation();

    manager.focusWindow(win.id);

    const target = event.currentTarget as HTMLElement;

    target.setPointerCapture(event.pointerId);

    resizeState = {
        pointerId: event.pointerId,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        origin: { ...win.rect },
    };
}

function moveResize(event: PointerEvent) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return;
    }

    const { direction, origin } = resizeState;

    const dx = event.clientX - resizeState.startX;
    const dy = event.clientY - resizeState.startY;

    let { x, y, width, height } = origin;

    if (direction.includes("e")) {
        width = Math.max(win.minWidth, origin.width + dx);
    }

    if (direction.includes("s")) {
        height = Math.max(win.minHeight, origin.height + dy);
    }

    if (direction.includes("w")) {
        width = Math.max(win.minWidth, origin.width - dx);
        x = origin.x + origin.width - width;
    }

    if (direction.includes("n")) {
        height = Math.max(win.minHeight, origin.height - dy);
        y = origin.y + origin.height - height;
    }

    manager.resizeWindow(win.id, {
        x,
        y,
        width,
        height,
    });
}

function endResize(event: PointerEvent) {
    if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return;
    }

    resizeState = null;
}

// -------------------------
// Window Controls
// -------------------------

function toggleMaximize() {
    manager.toggleMaximizeWindow(win.id);
}