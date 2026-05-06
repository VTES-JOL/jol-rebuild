import {useCallback, useMemo} from 'react';
import {AlertTriangle, BarChart2} from 'lucide-react';
import Spinner from '@/shared/components/Spinner';
import type {SeatingDto, SeatingRound} from './types';
import tournamentApi from './api';
import {useAsyncState} from '@/hooks/useAsyncState';

interface PlayerStats {
    registrationId: string;
    username: string;
    seatedRounds: number;
    avgTransfers: number;
    avgVpAvailable: number;
}

interface Anomaly {
    type: string;
    severity: 1 | 2 | 3 | 4 | 5;
    players: string[];
    description: string;
}

interface PlayerRoundRecord {
    registrationId: string;
    username: string;
    roundNumber: number;
    tableId: string;
    seatPosition: number;
    isBye: boolean;
}

const TRANSFERS: Record<number, number> = {1: 1, 2: 2, 3: 3, 4: 4, 5: 4};

const SEVERITY_STYLES: Record<number, {bg: string; border: string; text: string; label: string}> = {
    1: {bg: 'bg-blood/10',  border: 'border-blood/30',  text: 'text-blood-soft',   label: 'Critical'},
    2: {bg: 'bg-away/10',   border: 'border-away/30',   text: 'text-away',          label: 'Warning'},
    3: {bg: 'bg-accent/10', border: 'border-accent/20', text: 'text-accent-soft',   label: 'Notice'},
    4: {bg: 'bg-hover/30',  border: 'border-line/30',   text: 'text-ink-muted',     label: 'Info'},
    5: {bg: 'bg-hover/20',  border: 'border-line/20',   text: 'text-ink-muted',     label: 'Info'},
};

function computePlayerStats(seating: SeatingDto): PlayerStats[] {
    const map = new Map<string, {
        username: string;
        transferSum: number;
        vpSum: number;
        seatedRoundNums: Set<number>;
    }>();

    const getOrInit = (id: string, name: string) => {
        if (!map.has(id)) {
            map.set(id, {username: name, transferSum: 0, vpSum: 0, seatedRoundNums: new Set()});
        }
        return map.get(id)!;
    };

    // Compute table sizes per round (total assigned non-bye seats at each table)
    // Must be done before per-player accumulation so the full table context is known.
    const tableSizeByRoundAndTable = new Map<string, number>();
    for (const round of seating.rounds) {
        for (const table of round.tables) {
            tableSizeByRoundAndTable.set(`${round.roundNumber}:${table.id}`, table.seats.length);
        }
    }

    for (const round of seating.rounds) {
        for (const table of round.tables) {
            const tableSize = tableSizeByRoundAndTable.get(`${round.roundNumber}:${table.id}`) ?? 0;
            for (const seat of table.seats) {
                const entry = getOrInit(seat.registrationId, seat.username);
                // Only count each round once per player (guards against duplicate seat data)
                if (!entry.seatedRoundNums.has(round.roundNumber)) {
                    entry.seatedRoundNums.add(round.roundNumber);
                    entry.transferSum += TRANSFERS[seat.seatPosition] ?? 0;
                    entry.vpSum += tableSize;
                }
            }
        }
        for (const bye of round.byes) {
            getOrInit(bye.registrationId, bye.username);
        }
        for (const p of round.unseated) {
            getOrInit(p.registrationId, p.username);
        }
    }
    for (const p of seating.unseated) {
        getOrInit(p.registrationId, p.username);
    }

    return Array.from(map.entries())
        .map(([registrationId, d]) => {
            const seatedRounds = d.seatedRoundNums.size;
            return {
                registrationId,
                username: d.username,
                seatedRounds,
                avgTransfers: seatedRounds > 0 ? d.transferSum / seatedRounds : 0,
                avgVpAvailable: seatedRounds > 0 ? d.vpSum / seatedRounds : 0,
            };
        })
        .sort((a, b) => a.username.localeCompare(b.username));
}

function buildRecords(rounds: SeatingRound[]): PlayerRoundRecord[] {
    const records: PlayerRoundRecord[] = [];
    for (const round of rounds) {
        for (const table of round.tables) {
            for (const seat of table.seats) {
                if (!seat.bye) {
                    records.push({
                        registrationId: seat.registrationId,
                        username: seat.username,
                        roundNumber: round.roundNumber,
                        tableId: table.id,
                        seatPosition: seat.seatPosition,
                        isBye: false,
                    });
                }
            }
        }
        for (const bye of round.byes) {
            records.push({
                registrationId: bye.registrationId,
                username: bye.username,
                roundNumber: round.roundNumber,
                tableId: '',
                seatPosition: 0,
                isBye: true,
            });
        }
    }
    return records;
}

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const item of arr) {
        const k = key(item);
        const existing = map.get(k) ?? [];
        existing.push(item);
        map.set(k, existing);
    }
    return map;
}

function findSameTableEveryRound(records: PlayerRoundRecord[]): Anomaly[] {
    const byPlayer = groupBy(records, r => r.registrationId);
    const playerIds = Array.from(byPlayer.keys());
    const anomalies: Anomaly[] = [];

    for (let i = 0; i < playerIds.length; i++) {
        for (let j = i + 1; j < playerIds.length; j++) {
            const idA = playerIds[i], idB = playerIds[j];
            const seatedA = new Map(
                (byPlayer.get(idA) ?? []).filter(r => !r.isBye).map(r => [r.roundNumber, r])
            );
            const sharedSeated = (byPlayer.get(idB) ?? []).filter(r => !r.isBye && seatedA.has(r.roundNumber));

            if (sharedSeated.length < 2) continue;

            const sameTableEvery = sharedSeated.every(rb => seatedA.get(rb.roundNumber)!.tableId === rb.tableId);
            if (sameTableEvery) {
                const usernameA = byPlayer.get(idA)![0].username;
                const usernameB = byPlayer.get(idB)![0].username;
                anomalies.push({
                    type: 'same-table-every-round',
                    severity: 2,
                    players: [usernameA, usernameB],
                    description: `${usernameA} and ${usernameB} share the same table in every round they both play`,
                });
            }
        }
    }
    return anomalies;
}

function findPosition5Repeat(records: PlayerRoundRecord[]): Anomaly[] {
    const byPlayer = groupBy(records, r => r.registrationId);
    return Array.from(byPlayer.values()).flatMap(playerRecords => {
        const count = playerRecords.filter(r => !r.isBye && r.seatPosition === 5).length;
        if (count < 2) return [];
        return [{
            type: 'position-5-repeat',
            severity: 2 as const,
            players: [playerRecords[0].username],
            description: `${playerRecords[0].username} is in seat 5 in ${count} rounds`,
        }];
    });
}

function findRepeatSeatPosition(records: PlayerRoundRecord[]): Anomaly[] {
    const byPlayer = groupBy(records, r => r.registrationId);
    return Array.from(byPlayer.values()).flatMap(playerRecords => {
        const seated = playerRecords.filter(r => !r.isBye);
        const counts = new Map<number, number>();
        for (const r of seated) counts.set(r.seatPosition, (counts.get(r.seatPosition) ?? 0) + 1);
        return Array.from(counts.entries())
            .filter(([, c]) => c >= 2)
            .map(([pos, c]) => ({
                type: 'repeat-seat-position',
                severity: 3 as const,
                players: [playerRecords[0].username],
                description: `${playerRecords[0].username} is in seat ${pos} in ${c} rounds`,
            }));
    });
}

function findDuplicatePredatorPrey(records: PlayerRoundRecord[]): Anomaly[] {
    const byRoundTable = groupBy(records.filter(r => !r.isBye), r => `${r.roundNumber}::${r.tableId}`);
    const pairData = new Map<string, {predatorName: string; preyName: string; rounds: number[]}>();

    for (const tableRecords of byRoundTable.values()) {
        const sorted = [...tableRecords].sort((a, b) => a.seatPosition - b.seatPosition);
        const n = sorted.length;
        const roundNumber = sorted[0].roundNumber;
        for (let i = 0; i < n; i++) {
            const predator = sorted[i];
            const prey = sorted[(i + 1) % n];
            const key = `${predator.registrationId}->${prey.registrationId}`;
            const existing = pairData.get(key) ?? {predatorName: predator.username, preyName: prey.username, rounds: []};
            if (!existing.rounds.includes(roundNumber)) existing.rounds.push(roundNumber);
            pairData.set(key, existing);
        }
    }

    return Array.from(pairData.values())
        .filter(({rounds}) => rounds.length >= 2)
        .map(({predatorName, preyName, rounds}) => ({
            type: 'duplicate-predator-prey',
            severity: 1 as const,
            players: [predatorName, preyName],
            description: `${predatorName} is predator of ${preyName} in rounds ${rounds.sort((a, b) => a - b).join(', ')}`,
        }));
}

function findRepeatRelativePosition(
    records: PlayerRoundRecord[],
    targetPairs5: Array<[number, number]>,
    targetPairs4: Array<[number, number]>,
    type: string,
    severity: 4 | 5,
    label: string,
): Anomaly[] {
    const byRoundTable = groupBy(records.filter(r => !r.isBye), r => `${r.roundNumber}::${r.tableId}`);
    const pairCounts = new Map<string, {usernameA: string; usernameB: string; count: number}>();

    for (const tableRecords of byRoundTable.values()) {
        const tableSize = tableRecords.length;
        const targetPairs = tableSize === 5 ? targetPairs5 : tableSize === 4 ? targetPairs4 : null;
        if (!targetPairs || targetPairs.length === 0) continue;

        for (let i = 0; i < tableRecords.length; i++) {
            for (let j = i + 1; j < tableRecords.length; j++) {
                const a = tableRecords[i], b = tableRecords[j];
                const [p1, p2] = a.seatPosition < b.seatPosition
                    ? [a.seatPosition, b.seatPosition]
                    : [b.seatPosition, a.seatPosition];

                if (!targetPairs.some(([tp1, tp2]) => p1 === tp1 && p2 === tp2)) continue;

                const [idA, idB] = a.registrationId < b.registrationId
                    ? [a.registrationId, b.registrationId]
                    : [b.registrationId, a.registrationId];
                const pairKey = `${idA}:${idB}`;
                const existing = pairCounts.get(pairKey) ?? {
                    usernameA: a.registrationId < b.registrationId ? a.username : b.username,
                    usernameB: a.registrationId < b.registrationId ? b.username : a.username,
                    count: 0,
                };
                existing.count += 1;
                pairCounts.set(pairKey, existing);
            }
        }
    }

    return Array.from(pairCounts.values())
        .filter(({count}) => count >= 2)
        .map(({usernameA, usernameB, count}) => ({
            type,
            severity,
            players: [usernameA, usernameB],
            description: `${usernameA} and ${usernameB} share the ${label} relationship in ${count} rounds`,
        }));
}

function computeSeatingStats(seating: SeatingDto) {
    const records = buildRecords(seating.rounds);
    const players = computePlayerStats(seating);
    const anomalies: Anomaly[] = [
        ...findDuplicatePredatorPrey(records),
        ...findSameTableEveryRound(records),
        ...findPosition5Repeat(records),
        ...findRepeatSeatPosition(records),
        ...findRepeatRelativePosition(records, [[1,3],[2,4],[3,5]], [[1,3],[2,4]], 'repeat-relative-position', 4, 'grand-predator/grand-prey'),
        ...findRepeatRelativePosition(records, [[1,4],[2,5]], [], 'repeat-lesser-relative-position', 5, 'lesser relative'),
    ];
    return {players, anomalies};
}

function PlayerStatsTable({players}: {players: PlayerStats[]}) {
    return (
        <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <BarChart2 className="w-3 h-3"/> Player Statistics
            </h3>
            <div className="bg-hover/10 rounded-xl border border-line/30 overflow-hidden">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-line/20">
                            <th className="text-left px-4 py-2 text-ink-muted font-bold uppercase tracking-wider">Player</th>
                            <th className="text-right px-4 py-2 text-ink-muted font-bold uppercase tracking-wider">Avg Transfers</th>
                            <th className="text-right px-4 py-2 text-ink-muted font-bold uppercase tracking-wider">Avg VP Available</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line/20">
                        {players.map(p => (
                            <tr key={p.registrationId} className="hover:bg-hover/20 transition-colors">
                                <td className="px-4 py-2 text-ink">{p.username}</td>
                                <td className="px-4 py-2 text-ink font-mono text-right">
                                    {p.seatedRounds > 0 ? p.avgTransfers.toFixed(2) : '—'}
                                </td>
                                <td className="px-4 py-2 text-ink font-mono text-right">
                                    {p.seatedRounds > 0 ? p.avgVpAvailable.toFixed(2) : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function AnomalySection({anomalies}: {anomalies: Anomaly[]}) {
    return (
        <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted flex items-center gap-2">
                <AlertTriangle className="w-3 h-3"/> Seating Anomalies
            </h3>
            {anomalies.length === 0 ? (
                <p className="text-xs text-ink-muted italic text-center py-2">No seating anomalies detected.</p>
            ) : (
                <div className="space-y-2">
                    {anomalies.map((anomaly, idx) => {
                        const style = SEVERITY_STYLES[anomaly.severity];
                        return (
                            <div
                                key={idx}
                                className={`${style.bg} ${style.border} border rounded-lg px-4 py-3 flex items-start gap-3`}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${style.text}`}>
                                    {style.label}
                                </span>
                                <p className={`text-xs ${style.text}`}>{anomaly.description}</p>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

interface Props {
    tournamentId: string;
    refreshKey: number;
}

export default function TournamentSeatingStats({tournamentId, refreshKey}: Props) {
    const fetchSeating = useCallback(
        () => tournamentApi.getSeating(tournamentId),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tournamentId, refreshKey],
    );
    const {data: seating, loading, error} = useAsyncState<SeatingDto>(fetchSeating);

    if (loading && !seating) return <Spinner message="Loading seating statistics..." />;
    if (error && !seating) {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Could not load seating information.
            </div>
        );
    }
    if (!seating || seating.rounds.length === 0) {
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                No seating data yet. Add rounds to see statistics.
            </div>
        );
    }

    return <SeatingStatsContent seating={seating} />;
}

function SeatingStatsContent({seating}: {seating: SeatingDto}) {
    const stats = useMemo(() => computeSeatingStats(seating), [seating]);
    return (
        <div className="space-y-6">
            <PlayerStatsTable players={stats.players} />
            <AnomalySection anomalies={stats.anomalies} />
        </div>
    );
}
