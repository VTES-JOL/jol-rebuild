import React, {useEffect, useMemo, useState} from "react"
import {useAuthContext} from "@/contexts/AuthContext.tsx"
import AppLayout from "@/shared/layout/AppLayout.tsx"
import Panel from "@/shared/components/Panel.tsx"
import Button from "@/shared/components/Button.tsx"
import {updatePreferences} from "./api.ts"
import {COUNTRIES, flagUrl} from "./countries.ts"

interface TimezoneOption {
    tz: string
    label: string
}

function buildTimezones(): TimezoneOption[] {
    const now = new Date()
    return Intl.supportedValuesOf("timeZone").map(tz => {
        const offset = new Intl.DateTimeFormat("en", {
            timeZone: tz,
            timeZoneName: "shortOffset",
        }).formatToParts(now).find(p => p.type === "timeZoneName")?.value ?? ""
        return {tz, label: `${tz.replace('_', ' ')} (${offset})`}
    })
}

export default function ProfilePage() {
    const {user, refresh} = useAuthContext()

    const [countryCode, setCountryCode] = useState<string>("")
    const [zoneId, setZoneId] = useState<string>("")
    const [enableImages, setEnableImages] = useState(true)
    const [defaultBoard, setDefaultBoard] = useState<string>("linear")
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const timezones = useMemo(() => buildTimezones(), [])

    useEffect(() => {
        if (user) {
            setCountryCode(user.countryCode ?? "")
            setZoneId(user.zoneId ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
            setEnableImages(user.enableImages ?? true)
            setDefaultBoard(user.defaultBoard ?? "linear")
        }
    }, [user])

    if (!user) return null

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setSuccess(false)
        setError(null)
        try {
            await updatePreferences({
                countryCode: countryCode || null,
                zoneId: zoneId,
                enableImages,
                defaultBoard: defaultBoard || null,
            })
            await refresh()
            setSuccess(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save preferences")
        } finally {
            setSaving(false)
        }
    }

    const selectedCountry = COUNTRIES.find(c => c.code === countryCode)

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto w-full">
                <Panel title="Profile">
                    <div className="overflow-y-auto flex-1 p-6 space-y-8">

                        {/* Account info */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-4">Account</h3>
                            <div className="space-y-3">
                                <InfoRow label="Username" value={user.username} />
                                {user.email && <InfoRow label="Email" value={user.email} />}
                                {user.roles.length > 0 && (
                                    <InfoRow label="Roles" value={user.roles.join(", ")} />
                                )}
                            </div>
                        </section>

                        <div className="border-t border-line/60" />

                        {/* Preferences form */}
                        <section>
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-muted mb-4">Preferences</h3>
                            <form onSubmit={handleSave} className="space-y-6">

                                {/* Country */}
                                <div className="space-y-1.5">
                                    <label className="text-sm text-ink-muted" htmlFor="country">Country</label>
                                    <div className="flex items-center gap-3">
                                        {selectedCountry && (
                                            <img
                                                src={flagUrl(selectedCountry.code)}
                                                alt={selectedCountry.name}
                                                className="h-5 w-7 rounded-sm object-cover shrink-0"
                                            />
                                        )}
                                        <select
                                            id="country"
                                            value={countryCode}
                                            onChange={e => setCountryCode(e.target.value)}
                                            className="flex-1 px-3 py-2 rounded bg-surface/70 border border-line text-ink text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                                        >
                                            <option value="">— None —</option>
                                            {COUNTRIES.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Timezone */}
                                <div className="space-y-1.5">
                                    <label className="text-sm text-ink-muted" htmlFor="timezone">Timezone</label>
                                    <select
                                        id="timezone"
                                        value={zoneId}
                                        onChange={e => setZoneId(e.target.value)}
                                        className="w-full px-3 py-2 rounded bg-surface/70 border border-line text-ink text-sm focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
                                    >
                                        {timezones.map(({tz, label}) => (
                                            <option key={tz} value={tz}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Enable images */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-ink">Enable images</div>
                                        <div className="text-xs text-ink-muted mt-0.5">Show card artwork in game display</div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setEnableImages(v => !v)}
                                        aria-label="Toggle enable images"
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${enableImages ? "bg-accent" : "bg-hover"}`}
                                    >
                                        <span className={`inline-block h-5 w-5 rounded-full bg-surface shadow transform transition-transform duration-200 ${enableImages ? "translate-x-5" : "translate-x-0"}`} />
                                    </button>
                                </div>

                                {/* Default board */}
                                <div className="space-y-1.5">
                                    <div>
                                        <div className="text-sm text-ink">Default board layout</div>
                                        <div className="text-xs text-ink-muted mt-0.5">Which board view to use when entering a game</div>
                                    </div>
                                    <div className="flex items-center gap-0.5 rounded border border-line/50 p-0.5 w-fit">
                                        {([["linear", "Strip"], ["circular", "Table"], ["text", "Text"]] as const).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setDefaultBoard(value)}
                                                className={[
                                                    "text-xs px-3 py-1 rounded transition-colors",
                                                    defaultBoard === value
                                                        ? "bg-arcane/20 text-ink"
                                                        : "text-ink-muted hover:text-ink",
                                                ].join(" ")}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Feedback */}
                                {success && (
                                    <p className="text-sm text-online border border-online/30 rounded px-3 py-2" role="status">
                                        Preferences saved.
                                    </p>
                                )}
                                {error && (
                                    <p className="text-sm text-blood" role="alert">{error}</p>
                                )}

                                {/* Save */}
                                <Button type="submit" variant="primary" size="lg" loading={saving} className="w-full justify-center">
                                    {saving ? "Saving…" : "Save preferences"}
                                </Button>
                            </form>
                        </section>
                    </div>
                </Panel>
            </div>
        </AppLayout>
    )
}

function InfoRow({label, value}: {label: string; value: string}) {
    return (
        <div className="flex items-baseline gap-3">
            <span className="text-sm text-ink-muted w-20 shrink-0">{label}</span>
            <span className="text-sm text-ink">{value}</span>
        </div>
    )
}
