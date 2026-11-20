
import type { Component } from "svelte";

import type { OpenWindowOptions } from "#lib/types/oscore.ts";

// 모든 OS 프로그램이 공통으로 받는 Props
export type AppComponent = Component<{
    windowId: string;
}>;

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
} satisfies Record<string, AppDefinition>;

export type AppId = keyof typeof appRegistry;
