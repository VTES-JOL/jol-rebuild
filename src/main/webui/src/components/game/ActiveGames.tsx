import Panel from "../ui/Panel";
import GameRow from "./GameRow";

export default function ActiveGames() {
    return (
        <Panel title="Active Games (4)" right={<div className="w-2 h-2 rounded-full bg-blood shadow-glowRed" />}>
            <div className="py-2">
                <GameRow left="Open Game (3)" right="ShanDow 6:3" highlight />
                <GameRow left="ShaneS_A test" right="ShanDow" />
                <GameRow left="DoSeven" right="Palocles" />

                <div className="my-2 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />

                <GameRow left="Ousted Games (6)" right="" />
            </div>

            <div className="p-3">
                <button className="w-full rounded-md border border-[#3a2a1f] bg-gradient-to-br from-[#1a120d] to-[#0d0806] py-2 text-sm hover:shadow-glowRed">
                    + Open game for everyone
                </button>
            </div>
        </Panel>
    );
}