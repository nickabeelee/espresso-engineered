# Espresso Engineered — SDD (v1)  
  
Espresso Engineered Project  
  
## 1. Purpose and Principles  
  
Espresso Engineered is a web application for logging, analyzing, and sharing espresso brews. It is designed around espresso as a **daily ritual**, prioritizing **speed, fluidity, and minimal friction**. The system actively assists the user during brew preparation while staying out of the way.  
  
Core principles:  
* Minimize required input during the brewing moment  
* Reuse prior context aggressively  
* Surface intelligent suggestions at the right time  
* Allow reflection to happen later  
* Keep all interactions fast and forgiving  
  
## 2. Core Domain Model  
  
**Community-Shared Entities**  
  
These are global objects shared across users:  
* **Beans** – Named roasts from suppliers  
* **Bags** – Time-bound instances of a bean (aging, batch variability)  
* **Grinders**  
* **Machines**  
  
Users reference these entities but do not own private copies.  
  
**User-Generated Records**  
  
* **Brews** – The primary record type; represents a single espresso extraction  
* **Comments, Likes** – Social interactions attached to brews  
  
## 3. Brew Lifecycle  
  
### Brew Creation  
  
When starting a new brew:  
  
* The user is prompted: **“Fill inputs from previous brew?”**  
* Accepting pre-fills **inputs only**:  
    * Bag  
    * Machine  
    * Grinder  
    * Grind setting  
    * Dose  
    * Timestamp (now)  
  
### Draft State  
  
A brew may be saved as a **draft** with only input data.  
Outputs may be completed later:  
  
* Yield  
* Rating  
* Tasting notes  
* Reflections  
  
Draft brews are surfaced in a dedicated **“Awaiting Reflection”** section.  
  
Drafts:  
* Are saved online as soon as data exists  
* May be temporarily offline but reconcile automatically  
  
### Required Inputs  
  
A brew cannot be saved unless required inputs are present.  
If inputs are missing, the system:  
* Prompts the user to enter them, or  
* Offers to pull from the most relevant previous brew  
  
## 4. Grind Setting System  
  
Grind setting is a first-class concept.  
  
### Grinder-Specific Nomenclature  
  
* Each grinder may use arbitrary user-facing formats (e.g. 13g.4, 36.7, 18)  
* Each grinder may be **processed** to map its nomenclature to normalized **clicks**  
  
System behavior:  
* Users are clearly informed whether a grinder is processed  
* If processed, a nomenclature explanation is shown when entering grind settings  
* If not processed, grind entry is allowed but flagged as unnormalized  
  
## 5. Grind Setting Suggestions  
  
### Purpose  
The system predicts a grind setting targeting a **1.1 g/sec flow rate** using regression.  
  
### Data Hierarchy  
Suggestions prioritize:  
	1.	**Bag + Grinder**  
	2.	**Bean + Grinder** (fallback)  
  
Bag-level data is preferred once sufficient points exist.  
  
### UX Behavior  
  
* A grind suggestion appears **as soon as bag + grinder + machine are selected**  
* The suggestion updates live if relevant inputs change  
* A clear “Apply Suggested Grind” action is available  
* If no valid suggestion exists, an explicit state is shown explaining why  
  
Suggestions are:  
* Communal (all users contribute)  
* Applied per configuration (sharing is rare but intentional)  
  
## 6. CRUD and Discovery  
  
Users can create, view, edit, and delete:  
* Brews  
* Beans  
* Bags (including creating a bag inline while brewing)  
* Machines  
* Grinders  
  
Key UX rule:  
* Adding a new bean or bag must never force full navigation to separate forms  
* Inline creation is preferred wherever possible  
* Bag vs bean distinctions are handled by the system, not taught to the user  
  
Image uploads are supported for relevant entities.  
  
## 7. Social Model  
  
* Brews are **public by default**  
* Only owners (or admins) may edit brews  
  
Social interactions in v1:  
* Feed of recent brews  
* Likes  
* Comments  
* Brew comparisons  
  
No private feeds or notifications in v1.  
  
## 8. Authentication and Access  
* Authentication is required  
* Supabase-based auth  
* Supported login methods:  
    * Username + password  
  
## 9. Administration  
  
An admin portal exists with unrestricted access:  
* Edit or delete any entity  
* Normalize or process grinders  
* Moderate community content  
  
## 10. Explicit Non-Goals (v1)  
  
Out of scope for v1:  
* Notifications  
* Data import/export  
* Recipe marketplaces  
* Shot timers  
* Bluetooth scale or hardware integrations  
* Offline-first guarantees beyond draft reconciliation  
  
## 11. Evolution Strategy  
  
This system is intentionally designed as a **stable foundation**:  
* UI/UX and suggestion quality are the primary value  
* New features should layer on without refactoring core concepts  
* Data model and behaviors favor extensibility over completeness  
