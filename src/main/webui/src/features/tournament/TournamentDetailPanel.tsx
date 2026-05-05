import {useEffect, useRef, useState} from 'react';
import {Pencil, Trash2} from 'lucide-react';
import Panel from '@/shared/components/Panel';
import Button from '@/shared/components/Button';
import type {SeatingDto, Tournament} from './types';
import tournamentApi from './api';
import TournamentInfoView from './TournamentInfoView';
import TournamentEditForm from './TournamentEditForm';

interface Props {
    tournament: Tournament;
    isTournamentAdmin: boolean;
    onChanged: () => void;
    onDelete: () => void;
    onSeatingChanged?: () => void;
    initialEdit?: boolean;
}

export default function TournamentDetailPanel({tournament, isTournamentAdmin, onChanged, onDelete, onSeatingChanged, initialEdit}: Props) {
    const [isEditing, setIsEditing] = useState(initialEdit || false);
    const [editData, setEditData] = useState<Tournament>(tournament);
    const [isEditingName, setIsEditingName] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmUnpublish, setConfirmUnpublish] = useState(false);
    const [transitioning, setTransitioning] = useState(false);
    const [seating, setSeating] = useState<SeatingDto | 'error' | null>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditData(tournament);
        setIsEditingName(false);
        setConfirmDelete(false);
        setConfirmUnpublish(false);
        setSeating(null);
        if (initialEdit) setIsEditing(true);
    }, [tournament, initialEdit]);

    useEffect(() => {
        if (isEditingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditingName]);

    useEffect(() => {
        if (tournament.status === 'ACTIVE' || tournament.status === 'SEEDING'
            || tournament.status === 'FINALS' || tournament.status === 'COMPLETED') {
            tournamentApi.getSeating(tournament.id).then(setSeating).catch(() => setSeating('error'));
        }
    }, [tournament.id, tournament.status]);

    const canEdit = isTournamentAdmin && tournament.status === 'SETUP';

    const handleSave = async () => {
        try {
            await tournamentApi.update(tournament.id, editData);
            setIsEditing(false);
            onChanged();
        } catch (e) {
            console.error('Failed to update tournament', e);
        }
    };

    const handleTransition = async (action: () => Promise<Tournament>) => {
        setTransitioning(true);
        try {
            await action();
            onChanged();
        } catch (e) {
            console.error('Tournament transition failed', e);
        } finally {
            setTransitioning(false);
        }
    };

    const registrationEndPassed = tournament.registrationEnd
        ? new Date() > new Date(tournament.registrationEnd)
        : false;

    const renderAdminActions = () => {
        if (!isTournamentAdmin) return null;

        if (tournament.status === 'SETUP') {
            return (
                <Button variant="accent-ghost" size="sm" disabled={transitioning}
                    onClick={() => handleTransition(() => tournamentApi.publish(tournament.id))}>
                    Publish
                </Button>
            );
        }
        if (tournament.status === 'REGISTRATION') {
            return (
                <div className="flex items-center gap-2">
                    {confirmUnpublish ? (
                        <div className="flex items-center gap-1 bg-blood/10 px-2 py-1 rounded-lg">
                            <span className="text-[10px] text-blood-soft font-bold uppercase">Unpublish & clear?</span>
                            <button onClick={() => handleTransition(() => tournamentApi.unpublish(tournament.id)).then(() => setConfirmUnpublish(false))}
                                className="text-[10px] px-2 py-0.5 rounded bg-blood/20 text-blood hover:bg-blood/30 transition-colors">
                                Yes
                            </button>
                            <button onClick={() => setConfirmUnpublish(false)}
                                className="text-[10px] px-2 py-0.5 rounded hover:bg-hover text-ink-muted transition-colors">
                                No
                            </button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm" disabled={transitioning}
                            onClick={() => setConfirmUnpublish(true)}>
                            Unpublish
                        </Button>
                    )}
                    <Button variant="accent-ghost" size="sm"
                        disabled={transitioning || !registrationEndPassed}
                        title={!registrationEndPassed ? 'Registration must have closed first' : undefined}
                        onClick={() => handleTransition(() => tournamentApi.beginSeating(tournament.id))}>
                        Begin Seating
                    </Button>
                </div>
            );
        }
        return null;
    };

    const canEditName = canEdit && isEditing;
    const titleSlot = isEditingName ? (
        <input ref={nameInputRef} value={editData.name}
            onChange={e => setEditData(prev => ({...prev, name: e.target.value}))}
            onBlur={() => setIsEditingName(false)}
            onKeyDown={e => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') { setEditData(prev => ({...prev, name: tournament.name})); setIsEditingName(false); }
            }}
            className="bg-transparent text-ink tracking-wide outline-none border-b border-line-accent w-full max-w-[300px]"/>
    ) : (
        <span onClick={() => canEditName && setIsEditingName(true)}
            className={`tracking-wide text-ink ${canEditName ? 'cursor-pointer group flex items-center gap-2' : ''}`}>
            {editData.name}
            {canEditName && <Pencil className="w-3 h-3 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity"/>}
        </span>
    );

    return (
        <Panel
            title={titleSlot}
            right={
                <div className="flex items-center gap-2">
                    {renderAdminActions()}
                    {canEdit && (
                        <>
                            {isEditing ? (
                                <>
                                    {confirmDelete ? (
                                        <div className="flex items-center gap-1 bg-blood/10 px-2 py-1 rounded-lg">
                                            <span className="text-[10px] text-blood-soft font-bold uppercase">Delete?</span>
                                            <button onClick={onDelete}
                                                className="text-[10px] px-2 py-0.5 rounded bg-blood/20 text-blood hover:bg-blood/30 transition-colors">
                                                Yes
                                            </button>
                                            <button onClick={() => setConfirmDelete(false)}
                                                className="text-[10px] px-2 py-0.5 rounded hover:bg-hover text-ink-muted transition-colors">
                                                No
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmDelete(true)}
                                            className="p-1.5 rounded hover:bg-blood/10 text-ink-muted hover:text-blood transition-colors"
                                            title="Delete Tournament">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    )}
                                    <div className="h-4 w-[1px] bg-line/50 mx-1"/>
                                    <Button variant="ghost" size="sm"
                                        onClick={() => { setIsEditing(false); setEditData(tournament); setConfirmDelete(false); }}>
                                        Cancel
                                    </Button>
                                    <Button variant="accent-ghost" size="sm" onClick={handleSave}>Save Changes</Button>
                                </>
                            ) : (
                                <Button variant="accent-ghost" size="sm" onClick={() => setIsEditing(true)}>
                                    Edit Tournament
                                </Button>
                            )}
                        </>
                    )}
                </div>
            }
        >
            {isEditing
                ? <TournamentEditForm editData={editData} onDataChange={setEditData} />
                : <TournamentInfoView tournament={tournament} isTournamentAdmin={isTournamentAdmin} seating={seating} onChanged={onChanged} onSeatingChanged={onSeatingChanged} />
            }
        </Panel>
    );
}
