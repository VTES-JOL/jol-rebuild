export interface GameDto {
    id: number;
    name: string;
    status: string;
    format: string;
    owner: string | null;
}

const gameApi = {
    async getGame(id: number): Promise<GameDto> {
        const res = await fetch(`/games/${id}`, {
            credentials: "include",
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch game ${id}`);
        }
        return await res.json();
    }
};

export default gameApi;
