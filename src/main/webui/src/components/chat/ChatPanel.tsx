import Panel from "../ui/Panel";

export default function ChatPanel() {
    return (
        <Panel title="Global Chat" className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 text-sm">
                <p><b className="text-gray-200">JagerMelian</b> That’s so cool!</p>
                <p><b className="text-gray-200">System</b> New game created.</p>
                <p><b className="text-gray-200">Snodig</b> Good to have a legacy.</p>
            </div>

            {/* Input */}
            <div className="border-t border-white/10 p-2">
                <input
                    className="w-full bg-black/60 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blood"
                    placeholder="Chat with players..."
                />
            </div>
        </Panel>
    );
}