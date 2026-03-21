# Voice Assistant Database Integration Architecture (ElevenLabs + MCP + Supabase)

**Overarching Goal:** Create a voice-activated chatbot using ElevenLabs that can listen to the user, understand changes to be made to the database, and write those as **suggestions** via an MCP (Model Context Protocol) server to Supabase. These suggestions must be confirmed on the front end before they are permanently applied to the central database, ensuring no destructive updates occur without human approval.

Here is the step-by-step implementation plan.

---

### Step 1: Database Schema Design (Supabase)
To support a suggestion-based workflow, your database needs to track pending changes without overriding the source of truth.

1.  **Identify Core Tables:** Identify the tables the AI will suggest modifications for (e.g., `properties`, `users`).
2.  **Create a `suggestions` Table:** Instead of giving the AI direct UPDATE access to core tables, create a separate table to hold proposed changes.
    *   `id` (UUID, Primary Key)
    *   `target_table` (String, e.g., 'properties')
    *   `target_record_id` (UUID, the ID of the record being changed)
    *   `suggested_changes` (JSONB, the new values being proposed, e.g., `{"price": 450000, "status": "available"}`)
    *   `status` (Enum: 'pending', 'approved', 'rejected')
    *   `created_by_agent` (Boolean, true)
    *   `created_at` (Timestamp)
3.  **Set up Row Level Security (RLS):**
    *   Ensure the MCP Server (acting as a service role or specific authenticated user) only has `INSERT` and `SELECT` rights on the `suggestions` table.
    *   Ensure it has NO `UPDATE` or `DELETE` rights on the actual production data tables.

### Step 2: Create the MCP Server
The MCP server acts as the bridge between your ElevenLabs conversational agent and Supabase.

1.  **Initialize the Server:** Create a Node.js/TypeScript application using the `@modelcontextprotocol/sdk`.
2.  **Authentication:** Configure the server to authenticate with Supabase using a secure service role key (stored in environment variables).
3.  **Define MCP Tools:** Expose specific tools (functions) that the ElevenLabs agent can call.
    *   Tool: `suggest_database_update`
    *   Arguments: `tableName` (string), `recordId` (string), `changes` (JSON object).
4.  **Implement Tool Logic:** When `suggest_database_update` is called, the MCP server translates this into an `INSERT` statement into the `suggestions` table in Supabase.
5.  **Hosting:** Deploy the MCP Server (e.g., on Vercel, Railway, or Render) so it is accessible via a public URL alongside an API key for authentication.

### Step 3: Configure the ElevenLabs Conversational Agent
Set up the AI agent that will interact with the user via voice.

1.  **Create Agent:** Set up a Conversational AI agent in the ElevenLabs dashboard.
2.  **System Prompt:** Give the agent specific instructions.
    *   *Example:* "You are a helpful real estate assistant. When the user asks to update property information, you must use the `suggest_database_update` tool. You do not make direct changes. Inform the user that their request has been logged as a suggestion and requires manual approval."
3.  **Connect MCP Server:** In the ElevenLabs agent settings, add your newly deployed MCP Server as a tool provider. You will provide the URL of your deployed MCP server and the necessary authentication headers.
4.  **Frontend Integration:** Embed the ElevenLabs conversational widget into your Next.js application so users can speak to it.

### Step 4: Build the Frontend Confirmation Flow (Next.js)
The final step is allowing human administrators or users to review and approve the AI's suggestions.

1.  **Build a 'Review Suggestions' Dashboard:** Create a UI page in your Next.js app (e.g., `/admin/suggestions`).
2.  **Fetch Pending Suggestions:** Query the `suggestions` table in Supabase for all rows where `status = 'pending'`.
3.  **Display Changes (Diffing):** For each suggestion, fetch the originally targeted record based on `target_record_id`. Display a visual "diff" showing the old data versus the `suggested_changes` JSON.
4.  **Implement Action Buttons:** Add "Approve" and "Reject" buttons.
5.  **Approval Logic (Supabase RPC or API Route):**
    *   When "Approve" is clicked, trigger a secure backend function.
    *   This function must:
        1. Apply the JSON data from `suggested_changes` directly to the target record in the target table using an `UPDATE`.
        2. Change the `status` of the record in the `suggestions` table to 'approved'.
6.  **Rejection Logic:**
    *   When "Reject" is clicked, simply change the `status` in the `suggestions` table to 'rejected'.
