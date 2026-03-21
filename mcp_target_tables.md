# Target Tables for Voice Assistant (ElevenLabs MCP)

Based on the current database schema (`supabase-migration.sql`), the voice assistant will need to target the following tables and columns to accomplish the requested actions. **Remember: The AI will not modify these directly, but will propose changes (suggestions) that target these exact structures.**

### 1. Appointments (Bespoke / Agenda)
**Required actions:** Add/remove appointments, add appointment descriptions.

**Target Table 1:** `appointments`
*   `id` (UUID)
*   `title` (TEXT)
*   `date` (DATE)
*   `start_time` (TIME)
*   `end_time` (TIME)
*   `property_id` (UUID, optional foreign link)
*   `description` (TEXT) - *Used for adding appointment descriptions*

**Target Table 2:** `appointment_participants`
*   `appointment_id` (UUID)
*   `user_id` (UUID)
*(Needed to link specific users (buyers/sellers/agents) to the appointment)*

### 2. Properties (Vastgoed)
**Required actions:** Add descriptions to properties.

**Target Table:** `properties`
*   `id` (UUID)
*   `description` (TEXT) - *The AI will suggest updates specifically to this column.*
*(Other columns like `price`, `status`, etc., could also be targeted in the future if needed).*

### 3. Bids (Biedingen)
**Required actions:** Add bids, comment on bids.

**Target Table:** `bids`
*   `property_id` (UUID) - *Which property the bid is for.*
*   `buyer_id` (UUID) - *Who made the bid.*
*   `amount` (INTEGER) - *The numerical bid value.*
*   `comments` (TEXT) - *Used for adding comments/messages attached to the bid.*

### 4. Visits / Feedback (Bezoeken / Terugkoppeling)
**Required actions:** Add feedback for meetings/visits that happened.

**Target Table:** `visits`
*   `property_id` (UUID)
*   `buyer_id` (UUID)
*   `date` (TIMESTAMPTZ)
*   `feedback` (TEXT) - *The AI will insert the user's spoken feedback here.*
*   `rating` (INTEGER, 1 to 5) - *Optional: The AI could ask for a 1-5 rating verbally.*

---
*Note: I have only read the local `supabase-migration.sql` file to determine this structure. No actual database tables have been touched or modified.*
