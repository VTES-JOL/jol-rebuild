import type {SeatingDto, Tournament} from './types';
import TournamentRegistrationPanel from './TournamentRegistrationPanel';
import TournamentSeatingPanel from './TournamentSeatingPanel';
import TournamentSeatingReadOnlyView from './TournamentSeatingReadOnlyView';
import TournamentBasicInfo from './TournamentBasicInfo';
import TournamentRulesSettings from './TournamentRulesSettings';
import TournamentDates from './TournamentDates';
import TournamentRulesList from './TournamentRulesList';

interface Props {
    tournament: Tournament;
    isTournamentAdmin: boolean;
    seating: SeatingDto | 'error' | null;
    onChanged: () => void;
}

const ACTIVE_STATUSES = new Set(['ACTIVE', 'SEEDING', 'FINALS', 'COMPLETED']);

export default function TournamentInfoView({tournament, isTournamentAdmin, seating, onChanged}: Props) {
    const renderContextualContent = () => {
        if (tournament.status === 'REGISTRATION') {
            return <TournamentRegistrationPanel tournament={tournament} onChanged={onChanged} />;
        }
        if (tournament.status === 'SEATING' && isTournamentAdmin) {
            return (
                <TournamentSeatingPanel
                    tournament={tournament}
                    onActivated={onChanged}
                    onChanged={onChanged}
                />
            );
        }
        if (ACTIVE_STATUSES.has(tournament.status)) {
            return <TournamentSeatingReadOnlyView seating={seating} />;
        }
        return (
            <div className="h-24 flex items-center justify-center border-2 border-dashed border-line rounded-xl text-ink-muted text-sm italic">
                Player and Table information will appear here once the tournament begins.
            </div>
        );
    };

    return (
        <div className="p-6 space-y-8 overflow-y-auto flex-1 h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TournamentBasicInfo tournament={tournament} />
                <TournamentRulesSettings tournament={tournament} />
            </div>
            <TournamentDates tournament={tournament} />
            <TournamentRulesList rules={tournament.rules ?? []} conditions={tournament.conditions} />
            <div className="pt-4 border-t border-line/30">
                {renderContextualContent()}
            </div>
        </div>
    );
}
