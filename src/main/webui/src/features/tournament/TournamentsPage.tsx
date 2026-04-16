import {useEffect, useState} from 'react';
import MasterDetailView, {type PanelConfig} from '@/shared/layout/MasterDetailView';
import {useAuthContext} from "@/contexts/AuthContext.tsx";
import tournamentApi from './api';
import type {Tournament} from './types';
import TournamentListPanel from './TournamentListPanel';
import TournamentDetailPanel from './TournamentDetailPanel';
import EmptyState from '@/shared/components/EmptyState';
import {Trophy} from 'lucide-react';
import AppLayout from "@/shared/layout/AppLayout.tsx";

export default function TournamentsPage() {
    const {user} = useAuthContext();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [isNewlyCreated, setIsNewlyCreated] = useState(false);
    const [loading, setLoading] = useState(true);

    const isTournamentAdmin = user?.roles.includes('TOURNAMENT_ADMIN') ?? false;

    const loadTournaments = async () => {
        setLoading(true);
        try {
            const data = await tournamentApi.list();
            setTournaments(data);
            if (selectedTournament) {
                const updated = data.find(t => t.id === selectedTournament.id);
                if (updated) setSelectedTournament(updated);
            }
        } catch (e) {
            console.error('Failed to load tournaments', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTournaments();
    }, []);

    const handleCreate = async () => {
        try {
            const newT = await tournamentApi.create({
                name: 'New Tournament',
                format: 'SINGLE_DECK',
                gameFormat: 'STANDARD',
                numberOfRounds: 2,
                rules: [],
                conditions: []
            });
            await loadTournaments();
            setIsNewlyCreated(true);
            setSelectedTournament(newT);
        } catch (e) {
            console.error('Failed to create tournament', e);
        }
    };

    const handleDelete = async () => {
        if (!selectedTournament) return;
        try {
            await tournamentApi.remove(selectedTournament.id);
            setSelectedTournament(null);
            await loadTournaments();
        } catch (e) {
            console.error('Failed to delete tournament', e);
        }
    };

    const panels: [PanelConfig, PanelConfig] = [
        {
            key: 'list',
            label: 'All Tournaments',
            content: (
                <div className="flex-1 min-h-0">
                    <TournamentListPanel
                        tournaments={tournaments}
                        selectedId={selectedTournament?.id}
                        onSelect={(t) => { setSelectedTournament(t); setIsNewlyCreated(false); }}
                        onCreate={handleCreate}
                        loading={loading}
                        isTournamentAdmin={isTournamentAdmin}
                    />
                </div>
            )
        },
        {
            key: 'detail',
            label: 'Tournament Details',
            content: selectedTournament ? (
                <div className="flex-1 min-h-0">
                    <TournamentDetailPanel
                        tournament={selectedTournament}
                        isTournamentAdmin={isTournamentAdmin}
                        onChanged={loadTournaments}
                        onDelete={handleDelete}
                        initialEdit={isNewlyCreated}
                    />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-panel border border-line rounded-xl">
                    <EmptyState
                        icon={Trophy}
                        title="No tournament selected"
                        description="Select a tournament from the list to view its details."
                    />
                </div>
            )
        }
    ];

    return (
        <AppLayout background={"/Locations52.jpg"}>
            <MasterDetailView
                panels={panels}
                columns="320px 1fr"
                activeKey={selectedTournament ? 'detail' : 'list'}
            />
        </AppLayout>
    );
}
