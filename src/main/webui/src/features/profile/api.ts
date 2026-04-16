import {baseFetch} from '@/shared/api/client.ts';

export interface PreferencesPayload {
    countryCode: string | null
    zoneId: string
    enableImages: boolean
}

export async function updatePreferences(payload: PreferencesPayload): Promise<void> {
    const res = await baseFetch("/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
    })
    if (!res.ok) {
        throw new Error(`Failed to save preferences (${res.status})`)
    }
}
