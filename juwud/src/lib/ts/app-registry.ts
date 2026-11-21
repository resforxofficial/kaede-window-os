import type { Component } from "svelte";
import type { VirtualFileSystem } from "#lib/ts/filesystem.svelte.ts";
import type { OpenWindowOptions } from "#lib/types/oscore.ts";

export type AppProps = {
    windowId: string;
    fileSystem: VirtualFileSystem;
};

export type AppComponent = Component<AppProps>;

export interface AppDefinition {
    id: string;
    title: string;
    description: string;
    icon: string;
    defaultWindow: OpenWindowOptions;

    load: () => Promise<{
        default: AppComponent;
    }>;
}

export const appRegistry = {
    test: {
        id: "test",
        title: "테스트 프로그램",
        description: "Application Manager 테스트",
        icon: "🧪",

        defaultWindow: {
            width: 700,
            height: 450,
            minWidth: 400,
            minHeight: 300,
        },

        load: () => import("#lib/apps/test-app.svelte"),
    },

    terminal: {
        id: "terminal",
        title: "명령 프롬프트",
        description: "명령어로 OS 관리",
        icon: "⌨️",

        defaultWindow: {
            width: 760,
            height: 500,
            minWidth: 480,
            minHeight: 320,
        },

        load: () => import("#lib/apps/terminal.svelte"),
    },

    explorer: {
        id: "explorer",
        title: "파일 탐색기",
        description: "파일 폴더 및 관리",
        icon: "📁",
        defaultWindow: {
            width: 900,
            height: 550,
            minWidth: 560,
            minHeight: 380,
        },

        load: () => import("#lib/apps/explorer.svelte"),
    },
} satisfies Record<string, AppDefinition>;

export type AppId = keyof typeof appRegistry;
