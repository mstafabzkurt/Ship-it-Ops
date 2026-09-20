# Global messaging unread awareness

The authenticated app mounts one `MessagingUnreadProvider` inside the existing
account-keyed provider tree. It subscribes to `INSERT` events on
`public.direct_messages`, then debounces a call to
`get_direct_message_unread_total`. The RPC remains the source of truth. The
provider also fetches on mount, after the Realtime channel joins or reconnects,
and when the app or browser window returns to focus. It does not poll or add
client-side counts.

`direct_messages` contains `conversation_id` and `sender_id`, but no recipient
column. A Realtime filter on `sender_id` would not safely identify all messages
for the current user. The global channel therefore has no row filter. Supabase
Postgres Changes checks the table's authenticated SELECT policy before sending
rows; that policy permits only the two conversation participants. The callback
ignores the current user's own inserts and uses the remaining events only to
invalidate the unread RPC result. The existing conversation-specific Realtime
subscription still delivers active-chat messages.

On logout or account switch, the account-keyed tree unmounts, removes the
channel and focus listeners, cancels pending debounce work, invalidates pending
RPC results, and resets the unread count. The next authenticated user receives
a fresh provider and account-specific RPC result. The provider is independent
of player saves, theme, and device consent.

The global shortcut sits above the bottom tabs on mobile and at the lower
right on desktop, where there is no shared app header. It is hidden on active
gameplay, message routes, full-screen question details, onboarding/consent,
while player state is loading, and while the keyboard is open. Profile keeps
its existing Mesajlar entry with the same live unread count, so it does not
show a second shortcut.

Manual QA needs two authenticated accounts. On Home and Ranking, send messages
from A to B while B stays on the screen; verify B's badge updates without a
reload. On Profile, verify the existing Mesajlar row updates. Open the thread
and verify the unread count clears. Repeat on 390px mobile and desktop in dark
and Daylight themes, then switch accounts and verify the old count never
appears. Check that the shortcut is absent during active gameplay and in
message routes.
