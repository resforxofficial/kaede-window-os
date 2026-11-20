import {
    appRegistry,
    type AppComponent,
    type AppDefinition,
    type AppId,
} from "#lib/ts/app-registry.ts";
import type { WindowManager } from "#lib/ts/window-manager.svelte.ts";

export class ApplicationManager {
    // 로딩이 완료된 프로그램 컴포넌트
    loadedApps = $state<Record<string, AppComponent>>({});

    // 현재 로딩 중인 프로그램
    loadingApps = $state<string[]>([]);

    // 프로그램 실행 오류
    lastError = $state<string | null>(null);

    // 중복 로딩 방지
    #pendingLoads = new Map<string, Promise<AppComponent>>();

    constructor(private windowManager: WindowManager) { }

    // 등록된 프로그램 목록
    get availableApps(): AppDefinition[] {
        return Object.values(appRegistry);
    }

    // -------------------------
    // Application Launch
    // -------------------------

    async launch(appId: string): Promise<string | null> {
        const definition = appRegistry[appId as AppId];

        if (!definition) {
            this.lastError = `등록되지 않은 프로그램입니다: ${appId}`;
            return null;
        }

        try {
            const component = await this.#loadApp(definition);

            if (!component) {
                throw new Error("프로그램 컴포넌트를 불러오지 못했습니다.");
            }

            // 프로그램 로드가 완료된 후 창 생성
            const windowId = this.windowManager.openWindow(
                definition.id,
                definition.title,
                definition.defaultWindow,
            );

            this.lastError = null;

            return windowId;
        } catch (error) {
            console.error(`Failed to launch ${appId}:`, error);

            this.lastError =
                error instanceof Error
                    ? error.message
                    : "프로그램 실행 중 오류가 발생했습니다.";

            return null;
        }
    }

    // -------------------------
    // Dynamic Import
    // -------------------------

    async #loadApp(definition: AppDefinition): Promise<AppComponent> {
        const appId = definition.id;

        // 이미 로드된 프로그램
        const loaded = this.loadedApps[appId];

        if (loaded) return loaded;

        // 이미 로딩 중이라면 기존 Promise 재사용
        const pending = this.#pendingLoads.get(appId);

        if (pending) return pending;

        this.loadingApps = [...this.loadingApps, appId];

        const request = definition
            .load()
            .then(({ default: component }) => {
                this.loadedApps[appId] = component;

                return component;
            })
            .finally(() => {
                this.loadingApps = this.loadingApps.filter((id) => id !== appId);

                this.#pendingLoads.delete(appId);
            });

        this.#pendingLoads.set(appId, request);

        return request;
    }
}
