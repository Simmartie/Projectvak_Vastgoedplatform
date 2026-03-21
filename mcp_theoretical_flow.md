# Theoretical Implementation Guide: Voice AI to Frontend Execution

Here is the exact theoretical roadmap of how all the pieces connect—from the moment a user speaks to ElevenLabs, all the way to a human clicking "Approve" on your Next.js frontend.

---

### The Three Core Components

1.  **ElevenLabs Conversational AI Widget:** The physical microphone interface on your Next.js website.
2.  **The MCP Server (Node.js/TypeScript):** A small, independent backend service that translates AI logic into safe database commands.
3.  **Supabase:** The central nervous system holding both your live data and your "suggestions" queue.

### Step-by-Step Data Flow

#### Phase 1: The AI Suggestion (ElevenLabs -> MCP -> Supabase)

1.  **The User Speaks:** A "makelaar" (agent) clicks the ElevenLabs widget on your site and says: *"Hey, add a note to the apartment on Herengracht that the view is spectacular."*
2.  **ElevenLabs Processes:** The AI transcribes the audio, understands the intent, and realizes it needs to call a tool because its system prompt says: *"To modify data, you must use the `propose_update` tool."*
3.  **The Tool Call:** ElevenLabs sends an HTTP request to your hosted **MCP Server** with JSON arguments:
    ```json
    {
      "action": "update_property_description",
      "target_address": "Herengracht",
      "proposed_addition": "The view is spectacular."
    }
    ```
4.  **MCP Server Translates:** The MCP Server receives this JSON. It uses the `@supabase/supabase-js` library (configured with an `ANON_KEY` or `SERVICE_ROLE_KEY`) to run an `INSERT` command.
5.  **Supabase Logs it:** A new row is created in the `suggestions` table in Supabase.
    *   *The AI has no idea if the property exists, nor can it accidentally delete the `properties` table. It purely wrote a note in the suggestion box.*

#### Phase 2: The Frontend Execution (Supabase -> Next.js)

1.  **The Admin Logs In:** Any makelaar logs into the Administrator Dashboard on your React/Next.js frontend.
2.  **Fetching Pending Items:** The Next.js app queries Supabase:
    *   `SELECT * FROM suggestions WHERE status = 'pending';`
3.  **The UI Render:** Your React components render a global list. It shows *all* suggestions made by *any* colleague on the platform, including who made them:
    *   **Suggestion ID:** `#1042`
    *   **Created by:** `Jan Janssen`
    *   **Target:** `Property (Herengracht)`
    *   **Action:** Add to description: *"The view is spectacular."*
4.  **The Human Decision (The "Execute" Phase):** You (or any other makelaar) click a bright green **[Approve and Apply]** button on the frontend.
5.  **The Hard Change (Next.js -> Supabase):**
    *   Clicking that button triggers a Next.js Server Action (or API Route).
    *   That backend code connects to Supabase as your exact authenticated Profile (`auth.uid()`).
    *   Because you are logged in, Row Level Security permits the `UPDATE` on the `properties` table, appending the text to the description.
    *   It then runs an `UPDATE` on the `suggestions` table, changing the status from `'pending'` to `'approved'`.

---

### Security Architecture Summary

How do we guarantee the AI ONLY inserts, and the Frontend ONLY executes? **Row Level Security (RLS)**.

*   **The MCP Server's API Key:** You give the MCP Server a Supabase token that strictly has an RLS policy of `INSERT ON suggestions`. If the MCP Server tries to `UPDATE properties`, Supabase rejects the connection at the database level with a 403 Forbidden error.
*   **The Frontend's API Key:** You give the Next.js Frontend an authenticated user token (via `@supabase/ssr`). The RLS policies on the `properties` table state that `UPDATE` is allowed `USING (auth.uid() = seller_id OR auth.jwt() ->> 'role' = 'admin')`. Therefore, ONLY the frontend session of a logged-in human can authorize the actual change.
