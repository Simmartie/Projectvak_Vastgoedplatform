# ElevenLabs AI Agent & Webhook Integration

This document provides a comprehensive overview of how the ElevenLabs voice assistant is integrated into the Optimmo Real Estate platform, exactly which code files were altered, and how the internal webhooks connect the AI "brain" to the Supabase database.

## 1. Overview of the Flow
1. **User Interaction:** A makelaar logs into the platform. A floating ElevenLabs orb (`<elevenlabs-convai>`) appears in the bottom right corner.
2. **Voice NLP:** The user speaks into their microphone. The audio is streamed directly to ElevenLabs via WebRTC where the AI converts it to text and analyzes the intent.
3. **Tool Selection:** If the AI determines it needs data (e.g. "What are my viewings?" or "What is the EPC label of this address?"), it triggers the corresponding Tool configured in its dashboard.
4. **The Webhook Call:** ElevenLabs sends an HTTP `POST` request (the webhook) to your Next.js application containing the requested parameters in a JSON body.
5. **Database Execution:** Next.js securely parses the parameters, queries your Supabase database (`appointments` or `properties`), and returns the exact data back to ElevenLabs.
6. **Speech Synthesis:** ElevenLabs reads the raw JSON response, formulates a natural, spoken sentence in Dutch, and reads the answer out loud to the makelaar.

---

## 2. Code Changes Implemented

### Frontend Widget Injection
**File:** `components/header.tsx`
- The custom React AI button was completely removed to improve stability.
- Replaced with the native HTML widget component `<elevenlabs-convai agent-id="agent_9501kkpnxn7sefq9w11v25w80xty">`.
- The widget is injected securely into the DOM via a `useEffect` hook that mounts the required external script (`https://unpkg.com/@elevenlabs/convai-widget-embed`) exclusively when a user with the `role === 'makelaar'` logs in.

### Webhook 1: Get Agenda
**File:** `app/api/elevenlabs/tools/getAgenda/route.ts`
- **Purpose:** Fetches the Makelaar's agenda items for a specific date.
- **Mechanism:** Parses the JSON body for the `date` (or `startDate`) parameter.
- **Database Target:** Directly executes `supabase.from('appointments').select('*').eq('date', targetDate)`.
- **Safety:** If ElevenLabs fails to provide a date, the webhook gracefully catches it and returns a `400 Bad Request` with an exact error message, prompting the AI to ask the user for a more specific date rather than crashing the system with a 500 error.

### Webhook 2: Get Dossier
**File:** `app/api/elevenlabs/tools/getDossier/route.ts`
- **Purpose:** Fetches comprehensive real estate dossier data (EPC labels, prices, sizes, statuses) for a specific property.
- **Mechanism:** Parses the JSON body for the `address` parameter.
- **Database Target:** Directly executes `supabase.from('properties').select('*').ilike('address', '%' + targetAddress + '%').limit(1)`.
- **Safety:** Utilizes a fuzzy `ilike` search to maximize the chances of matching an address successfully, while avoiding `PGRST116` crashes if an address yields zero results.

### Environment Variables
**File:** `.env.local`
- A new variable `VERCEL_WEBHOOK_KEY` was established.
- This must precisely match the custom secret defined inside the ElevenLabs dashboard headers (`x-api-key`). It acts as the gatekeeper against unauthorized webhook spam.

---

## 3. Required ElevenLabs Dashboard Configurations

For this entire architectural chain to function perfectly, the ElevenLabs agent MUST be precisely configured through the ElevenLabs Web UI:

### Agent System Prompt
The main prompt requires explicit instructions so the AI does not hallucinate years or refuse to use its tools. **Important additions to the prompt:**
> "Je bent een all-round makelaars-assistent. Je hebt live toegang tot zowel de agenda ALS de gedetailleerde vastgoeddossiers via je tools. Als de gebruiker vraagt naar een adres, pand, of details, ben je VERPLICHT direct je getDossier tool te gebruiken!"
> 
> "BELANGRIJK: Vandaag is [Plaats hier huidige datum, bv. 21 maart 2026]. Gebruik altijd dit huidige jaartal wanneer de gebruiker vraagt naar 'vandaag' of 'morgen' en formatteer de datum strak als YYYY-MM-DD in de getAgenda tool!"

### Tool 1: getAgenda
- **Description:** "Gebruik deze tool ALTIJD onmiddellijk wanneer de gebruiker vraagt naar zijn agenda, bezichtigingen of afspraken voor een bepaalde datum."
- **Parameters:** Must contain exactly `date` (Type: String).

### Tool 2: getDossier
- **Description:** "Gebruik deze tool ALTIJD onmiddellijk wanneer de gebruiker vraagt naar gedetailleerde informatie van een specifiek pand, zoals een EPC-label, de vraagprijs, kamers, of de algemene status."
- **Parameters:** Must contain exactly `address` (Type: String).
