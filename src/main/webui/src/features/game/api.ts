export interface GameDto {
    id: number;
    name: string;
    status: string;
    format: string;
    owner: string | null;
}

const gameApi = {
    async getGame(id: number): Promise<GameDto> {
        const res = await fetch(`/api/games/${id}`, {
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch game ${id}`);
        }
        return await res.json();
    },

    async listActive(): Promise<GameDto[]> {
        const res = await fetch(`/api/games/active`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch active games");
        return await res.json();
    },

    async listOpen(): Promise<GameDto[]> {
        const res = await fetch(`/api/games/open`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch open games");
        return await res.json();
    },

    async listMyActive(): Promise<GameDto[]> {
        const res = await fetch("/api/games/active/me", { credentials: "include"});
        if (!res.ok) throw new Error("Failed to fetch user active games");
        return await res.json();
    }
};

export default gameApi;
