import type {
    WindowState,
    OpenWindowOptions,
    WindowRect,
} from "#lib/types/oscore.ts";

export class WindowManager {
    windows = $state<WindowState[]>([]);
    activeWindowId = $state<string | null>(null);

    private zIndex = 10;
    private sequence = 0;

    /**
     * 새로운 창 생성
     */
    openWindow(
        appId: string,
        title: string,
        options: OpenWindowOptions = {},
        appData: Record<string, unknown> = {}
    ): string {
        const offset = (this.windows.length % 8) * 28;

        const id = `${appId}-${Date.now()}-${++this.sequence}`;

        const window: WindowState = {
            id,
            appId,
            title,

            rect: {
                x: options.x ?? 64 + offset,
                y: options.y ?? 48 + offset,
                width: options.width ?? 800,
                height: options.height ?? 560,
            },

            minWidth: options.minWidth ?? 360,
            minHeight: options.minHeight ?? 240,

            zIndex: ++this.zIndex,

            isMinimized: false,
            isMaximized: false,
            appData: { ...appData },
        };

        this.windows = [...this.windows, window];
        this.activeWindowId = id;

        return id;
    }

    /**
     * 창 활성화
     */
    focusWindow(id: string) {
        const exists = this.windows.some((window) => window.id === id);

        if (!exists) return;

        this.windows = this.windows.map((window) =>
            window.id === id
                ? {
                    ...window,
                    isMinimized: false,
                    zIndex: ++this.zIndex,
                }
                : window,
        );

        this.activeWindowId = id;
    }

    /**
     * 창 닫기
     */
    closeWindow(id: string) {
        this.windows = this.windows.filter((window) => window.id !== id);

        if (this.activeWindowId === id) {
            this.activateTopmostWindow();
        }
    }

    /**
     * 창 최소화
     */
    minimizeWindow(id: string) {
        this.windows = this.windows.map((window) =>
            window.id === id ? { ...window, isMinimized: true } : window,
        );

        if (this.activeWindowId === id) {
            this.activateTopmostWindow();
        }
    }

    /**
     * 작업 표시줄 창 버튼
     */
    toggleTaskbarWindow(id: string) {
        const window = this.windows.find((item) => item.id === id);

        if (!window) return;

        if (window.isMinimized || this.activeWindowId !== id) {
            this.focusWindow(id);
        } else {
            this.minimizeWindow(id);
        }
    }

    /**
     * 최대화 및 복원
     */
    toggleMaximizeWindow(id: string) {
        this.windows = this.windows.map((window) =>
            window.id === id
                ? { ...window, isMaximized: !window.isMaximized }
                : window,
        );

        this.focusWindow(id);
    }

    /**
     * 창 위치 변경
     */
    moveWindow(id: string, x: number, y: number) {
        this.windows = this.windows.map((window) =>
            window.id === id && !window.isMaximized
                ? {
                    ...window,
                    rect: {
                        ...window.rect,
                        x,
                        y,
                    },
                }
                : window,
        );
    }

    /**
     * 창 크기 변경
     */
    resizeWindow(id: string, rect: WindowRect) {
        this.windows = this.windows.map((window) =>
            window.id === id && !window.isMaximized
                ? {
                    ...window,
                    rect: {
                        ...rect,
                        width: Math.max(window.minWidth, rect.width),
                        height: Math.max(window.minHeight, rect.height),
                    },
                }
                : window,
        );
    }

    /**
     * 가장 위에 있는 창 활성화
     */
    private activateTopmostWindow() {
        const next = this.windows
            .filter((window) => !window.isMinimized)
            .sort((a, b) => b.zIndex - a.zIndex)[0];

        this.activeWindowId = next?.id ?? null;
    }
}
