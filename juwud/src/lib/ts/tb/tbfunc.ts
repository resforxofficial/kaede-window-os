export function getWindowIcon(appId: string) {
    const icons: Record<string, string> = {
        explorer: "📁",
        terminal: "⌨",
        trigle: "🔍",
        notepad: "📝",
        paint: "🎨",
        gallery: "🖼",
        music: "♫",
        test: "▣",
    };

    return icons[appId] ?? "▣";
}

export type StartMenuApp = {
    id: string;
    title: string;
    description?: string;
    icon?: string;
};
