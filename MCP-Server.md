# MCP Server Connectie Roadmap 🗺️

Dit document beschrijft de exacte, chronologische volgorde om ElevenLabs, Supabase, Vercel en onze custom MCP Server aan elkaar te koppelen tot één werkend ecosysteem voor spraakgestuurde database suggesties.

---

### Fase 1: Databank & Authenticatie Fundering (Supabase)
Voordat de agent of de server kan werken, moet de databankstructuur klaar staan om acties te ontvangen.

1. **`suggestions` Tabel Aanmaken:** Maak de tabel aan in Supabase die fungeert als 'brievenbus' voor de AI.
2. **Row Level Security (RLS) Instellen:** Beveilig de hoofdtabellen (enkel Read) en de suggestions tabel (enkel Insert voor de MCP, Insert/Update/Delete voor de Admin).
3. **Database Keys Verzamelen:** Haal de `NEXT_PUBLIC_SUPABASE_URL` en de (geheime) `SUPABASE_SERVICE_ROLE_KEY` op uit je Supabase dashboard. Deze laatste geeft de backend server de nodige rechten.

### Fase 2: De MCP Server Bouwen (Backend)
De MCP server is de "tolk" tussen de AI en de databank. We bouwen dit als een apart proces (of als Vercel Edge/Serverless functies).

1. **Project Initialisatie:** Zet een nieuwe Node.js/TypeScript codebase op specifiek voor de MCP Server.
2. **Supabase Client Koppelen:** Integreer de `@supabase/supabase-js` SDK in de MCP Server met behulp van de Service Role Key uit Fase 1.
3. **Tools Programmeren:** Schrijf de code voor specifieke tools. 
   * Bijv. `suggest_property_update(id, changes)` -> voert de INSERT query uit naar Supabase.
   * Bijv. `get_my_appointments(user_id)` -> voert de SELECT query uit naar Supabase.
4. **Validatie (Zod) Toevoegen:** Zorg dat de tools binnenkomende requests strikt valideren (mag de AI enkel "price" en "description" aanpassen? Dan blokkeert Zod alle andere pogingen).

### Fase 3: De MCP Server Host Lanceren (Vercel)
Jouw gedachte klopt volledig: **ElevenLabs praat direct met Supabase via de MCP**. Maar die "MCP" is gewoon een stukje computercode (Fase 2). Die code moet ergens op het internet *draaien* zodat ElevenLabs ertegen kan praten. Dat is de énige reden dat Vercel (of een andere host) in dit lijstje staat.

1. **Deployen naar Vercel (Hosting):** Je zet de MCP Node.js code online als een "Vercel Serverless Function". Vercel doet verder niets, het houdt enkel je MCP-code online (bijv. op `mcp-vastgoed.vercel.app`).
2. **Environment Variables Instellen:** Voeg de Supabase keys veilig toe aan de cloud op Vercel, zodat je MCP-code de database in kan.
3. **Beveiliging (API Key):** Stel een eigen secret in op de Vercel Server (bijv. `MCP_SERVER_API_KEY`) zodat enkel *jouw* ElevenLabs widget tegen jouw MCP-code mag praten.

### Fase 4: Het Brein Koppelen (ElevenLabs)
Nu de spieren (Supabase) en het zenuwstelsel (MCP) werken, sluiten we het brein aan.

1. **Agent Aanmaken:** Creëer de Conversational Agent in ElevenLabs.
2. **System Prompt Schrijven:** Vertel de agent precies wat zijn doel is (read-only + suggesties maken) en hoe die zich moet gedragen.
3. **Custom Tool (Webhook) Configureren:**
   * Voeg in ElevenLabs een custom tool toe en wijs deze naar de URL van je Vercel MCP Server (uit Fase 3).
   * Geef de API Key (uit Fase 3) mee als Authorization header, zodat Vercel de requests van ElevenLabs toelaat.
   * Kopieer de argument-schema's (bijv. het Zod schema uit Fase 2) in de ElevenLabs interface zodat de AI weet welke data hij exact moet doorsturen.

### Fase 5: Het Gezicht Koppelen (Vercel/Next.js Frontend)
De laatste stap is alles zichtbaar en bruikbaar maken voor de eindgebruiker.

1. **De Microfoon Widget Integreren:** Plaats de ElevenLabs Conversational Widget component binnen de Next.js React applicatie.
2. **Identiteit Doorgeven (Dynamic Variables):** Zorg dat de Next.js app de ID van de ingelogde gebruiker (uit de Supabase Auth sessie) doorgeeft aan de ElevenLabs widget. (ElevenLabs stuurt dit dan weer door naar de MCP server via de tool, zodat de MCP server weet onder wiens naam de acties gebeuren).
3. **Admin Dashboard Bouwen:** Bouw in Next.js de UI pagina waar de makelaar/admin de openstaande suggesties (uit Fase 1) kan zien, goedkeuren, en weigeren.
4. **Push to Production:** Deploy de geüpdatete Next.js website (nu mèt microfoon en admin pagina) naar de bestaande Vercel omgeving.

---

### Samenvattende Volgorde:
**Supabase (Fundering)  ->  MCP Code (Logica)  ->  Vercel (Hosting MCP)  ->  ElevenLabs (AI Koppeling)  ->  Next.js (Frontend Integratie)**
