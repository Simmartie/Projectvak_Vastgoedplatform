# Supabase Fundering Setup (Fase 1)

Dit is het exacte actieplan om de database klaar te maken voor de AI. **Voer deze stappen pas uit wanneer je er helemaal klaar voor bent.** Alles gebeurt via het Supabase Online Dashboard.

### Stap 1: De `suggestions` Tabel Aanmaken
Ga in je Supabase dashboard naar de **SQL Editor** en plak de volgende code in een lege query. Klik daarna op `RUN`. 

Dit creëert de brievenbus waar de AI (via de MCP) zijn notities in dumpt.

```sql
-- Creëer een Enum voor de status van een suggestie
CREATE TYPE suggestion_status AS ENUM ('pending', 'approved', 'rejected');

-- Creëer de suggestions tabel
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_table TEXT NOT NULL,          -- Bijv. 'properties' of 'appointments'
  target_id UUID NOT NULL,             -- De ID van het huis/afspraak
  json_changes JSONB NOT NULL,         -- Wat er precies veranderd moet worden (bijv. {"description": "Nieuwe tekst"})
  status suggestion_status DEFAULT 'pending', 
  created_by_user_id UUID REFERENCES users(id), -- Wie sprak er in de microfoon?
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ              -- Wanneer heeft de admin op 'Approve' geklikt?
);
```

### Stap 2: Beveiliging Aanzetten (Row Level Security - RLS)
De tabel bestaat nu, maar standaard mag *niemand* er iets mee doen (omdat we veiligheid belangrijk vinden). We moeten specifieke "Politie-regels" (Policies) instellen.

Plak deze code direct onder de vorige in de **SQL Editor** en klik nogmaals op `RUN`:

```sql
-- Zet de beveiliging aan voor de nieuwe tabel
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Regel 1: Iedere ingelogde gebruiker mag naar de tabel schrijven mits het hun eigen ID is
-- Dit zorgt ervoor dat de ElevenLabs app (via MCP) nooit suggesties kan toevoegen onder de naam van iemand anders.
CREATE POLICY "Users can insert own suggestions" 
ON suggestions FOR INSERT 
WITH CHECK (auth.uid() = created_by_user_id);

-- Regel 2: Elke Makelaar in het systeem mag alle suggesties zien en goedkeuren
-- Dit zorgt ervoor dat eender welke admin kan zien wie de suggestie gemaakt heeft en die kan accepteren. We controleren dit via de JWT role claim.
CREATE POLICY "Makelaars can view all suggestions" 
ON suggestions FOR SELECT 
USING (auth.jwt() ->> 'role' = 'makelaar');

CREATE POLICY "Makelaars can update all suggestions" 
ON suggestions FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'makelaar');
```
*(Opmerking: Regel 2 zorgt er nu voor dat zolang je ingelogd bent met de rol 'makelaar' op het platform, je alle suggesties – direct met de auteur vermeld – kunt zien en er op 'Accepteren' kunt klikken. De AI (Regel 1) blijft veilig vastgepind aan het eigen ID van de inloggende gebruiker.)*

### Stap 3: De Geheime Sleutels Pakken
Nu de databank technisch klaar staat, heb je de sleutels nodig zodat de applicaties (Next.js & MCP) later kunnen inloggen.

1. Ga in je Supabase Dashboard links onderaan naar het tandwieltje **(Project Settings)**.
2. Klik in het linkermenu op **API**.
3. Je ziet nu twee belangrijke keys:
   * **Project URL:** `https://xxxxxx.supabase.co`
   * **Project API Keys -> anon / public:** `eyJh...`
4. **Waar sla je deze op?**
   * **Voor lokaal testen op je laptop:** Plak ze in een bestand genaamd `.env.local` in de root van je codebase. Next.js leest dit automatisch uit als je `npm run dev` doet.
     ```env
     NEXT_PUBLIC_SUPABASE_URL=jouw_project_url_hier
     NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw_anon_key_hier
     SUPABASE_SERVICE_ROLE_KEY=jouw_secret_role_key_hier
     ```
   * **Voor Productie (Online):** Omdat je via Vercel werkt, hoef je (en mag je!) `.env.local` **niet** mee uploaden (dit staat normaal ook in je `.gitignore`). In plaats daarvan ga je naar het dashboard op **Vercel.com** -> Jouw Project -> **Settings** -> **Environment Variables** en plak je daar deze drie variabelen. Vercel injecteert ze dan veilig in de draaiende code.

### Klaar!
Als je de SQL queries succesvol hebt gereleased (`RUN`) en je `.env.local` hebt geüpdatet, is **Fase 1** officieel 100% afgerond en ben je klaar om aan de MCP Server code (Fase 2) te beginnen.

---

## Suggestions Table Layout (Verwachte JSON Structuren)
Tijdens het rondrijden zijn er specifieke acties die een makelaar snel wil kunnen inspreken. Hieronder zie je exact *wat* de MCP server in de `json_changes` kolom zal opslaan voor de meest logische acties *on the road*. Dit zorgt ervoor dat je Next.js Admin Dashboard exact weet welke data hij moet wegschrijven.

#### 1. Bezichtigingen (Visits) Notities
Na een bezichtiging wil je feedback van de kandidaat-koper noteren.
*   **`target_table`**: `'visits'`
*   **`target_id`**: *[De ID van dat specifieke bezoek]*
*   **`json_changes`**:
    ```json
    {
      "feedback": "Kandidaat was erg enthousiast over de tuin, maar vond de badkamer wat verouderd.",
      "status": "completed"
    }
    ```

#### 2. Biedingen (Bids) Doorgeven
Als een klant je belt in de auto om een bod te doen.
*   **`target_table`**: `'bids'`
*   **`target_id`**: *[Laat dit leeg of gebruik een dummy ID. De actie is "Nieuw bod registreren" via een suggestie.]* 
*   **`json_changes`**:
    ```json
    {
      "property_id": "uuid-van-het-pand",
      "amount": 450000,
      "conditions": "Onder voorbehoud van financiering, zonder bouwtechnische keuring."
    }
    ```
    *(Opmerking: De AI plaatst dit 100% veilig in de `suggestions` tabel. Pas als de Makelaar op "Accepteren" klikt, maakt de Next.js app de definitieve rij aan in de echte `bids` tabel).*

#### 3. Woning Beschrijving Aanvullen
Tijdens een eerste bezoek (intake) zie je details die in de beschrijving of kenmerken moeten.
*   **`target_table`**: `'properties'`
*   **`target_id`**: *[De ID van het pand]*
*   **`json_changes`**:
    ```json
    {
      "description_append": "\n\nExtra notitie: Het pand heeft onlangs nog volledig HR++ glas gekregen aan de voorzijde.",
      "living_area": 145 
    }
    ```
*(Opmerking: We schrijven hier `description_append` in plaats van de hele beschrijving te overschrijven. De Next.js admin knop moet dan de tekst gewoon toevoegen aan de bestaande beschrijving).*

#### 4. Waardebepaling (Schatting) & Bouwmisdrijf / Renovatie
Dit zijn perfecte details om snel via de microfoon vast te leggen.
*   **`target_table`**: `'properties'`
*   **`target_id`**: *[De ID van het pand]*
*   **`json_changes`**:
    ```json
    {
      "estimated_value": 525000,
      "legal_notes": "Let op: De uitbouw overkapping achteraan heeft mogelijk geen vergunning (risico bouwmisdrijf).",
      "renovation_required": true
    }
    ```

#### 5. Afspraken Maken (Appointments) - *Optioneel*
Inspreken voor de agenda.
*   **`target_table`**: `'appointments'`
*   **`target_id`**: *[Laat leeg of gebruik dummy ID]*
*   **`json_changes`**:
    ```json
    {
      "property_id": "uuid-van-het-pand",
      "date": "2026-03-18T14:30:00Z",
      "client_name": "Meneer Peeters",
      "type": "intakegesprek"
    }
    ```
    *(Opmerking: Net zoals bij biedingen is dit een puur onschuldig "briefje" in de `suggestions` doos. De echte kalender wijzigt pas na de menselijke goedkeuring).*
