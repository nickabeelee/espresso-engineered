# EE Architecture Spec  
  
Espresso Engineered Project  
  
⸻  
  
PURPOSE  
  
Define a modern, AI-assisted web application stack optimized for:  
• low-latency interaction  
• persistent backend computation  
• strong data modeling and authorization  
• minimal operational overhead  
• AI-driven development workflows  
  
This specification defines **infrastructure, tooling, and responsibility boundaries only**.  
  
⸻  
  
CORE ARCHITECTURAL PRINCIPLES  
  
• Rendering and computation are separate concerns  
• Persistent backend compute (not serverless-first)  
• Authentication and authorization enforced at the data layer  
• Backend owns business logic and analytics  
• Frontend remains thin and presentation-focused  
• AI agents generate and evolve code from specifications  
• All workflows must be usable without heavy CLI dependence  
  
⸻  
  
SYSTEM OVERVIEW  
  
Client (Web Frontend)  
→ Backend Compute API  
→ Supabase (Auth + Database + Realtime)  
  
Frontend and backend are deployed independently to platforms optimized for their workloads.  
  
⸻  
  
FRONTEND LAYER  
  
Framework  
• SvelteKit (TypeScript)  
  
Hosting  
• Netlify  
  
Responsibilities  
• UI rendering and interaction  
• Animation and visual state  
• Calling backend APIs  
• Subscribing to realtime updates  
• Managing auth tokens via Supabase client  
  
Characteristics  
• Fast perceived performance  
• Animation-heavy, bespoke UI  
• Preview deployments for rapid iteration  
• No core business logic  
  
Non-Responsibilities  
• Analytical computation  
• Suggestion logic  
• Authorization rules  
  
⸻  
  
BACKEND COMPUTE LAYER  
  
Runtime  
• Node.js (TypeScript)  
• Fastify framework  
  
Hosting  
• Fly.io (container-based, always-on)  
  
Responsibilities  
• Business logic and orchestration  
• Analytical computation and heuristics  
• Suggestion and scoring engines  
• Data aggregation across entities  
• In-memory caching and optimization  
• Backend-for-Frontend (BFF) API  
  
Characteristics  
• Persistent processes  
• Predictable low latency  
• No cold starts  
• Horizontally scalable  
  
Non-Responsibilities  
• Authentication source of truth  
• Row-level authorization enforcement  
• UI rendering  
  
⸻  
  
DATA & AUTH LAYER  
  
Platform  
• Supabase  
  
Responsibilities  
• PostgreSQL database (system of record)  
• Authentication (JWT-based)  
• Row Level Security (authorization)  
• Realtime subscriptions  
  
Rules  
• All tables must use RLS  
• Frontend uses user-scoped JWTs only  
• Backend may use service-role access when required  
• Authorization logic lives in the data layer  
  
⸻  
  
AI-ASSISTED DEVELOPMENT  
  
Tool  
• Kiro  
  
Responsibilities  
• Generate frontend and backend code from specs  
• Generate schemas and migrations  
• Scaffold APIs and UI components  
• Refactor logic and analytics pipelines  
  
Interaction Model  
• Specification → Tasks → Generated Code → Review → Iterate  
  
Kiro is a development agent, not a runtime dependency.  
  
⸻  
  
SOURCE CONTROL & WORKFLOW  
  
• GitHub as source of truth  
• Feature branches for experimentation  
• Main branch represents production  
• Netlify preview deploys for frontend review  
• Fly.io deployments for backend services  
  
Workflows must be operable from:  
• browser-based tools  
• iPad  
• desktop environments  
  
⸻  
  
DEPLOYMENT MODEL  
  
Frontend  
• Netlify auto-deploys from main branch  
  
Backend  
• Container deployment to Fly.io  
• Always-on services  
• Environment-scoped configuration  
  
Data  
• Supabase project per environment  
  
⸻  
  
SCALING & EVOLUTION  
  
This architecture supports:  
• Increasing analytical sophistication  
• Real-time interaction patterns  
• Additional client applications (e.g. native mobile)  
• AI-assisted development without architectural rewrites  
  
Explicitly avoids:  
• Serverless-only backends for core logic  
• Overloaded frontend runtimes  
• Premature microservice complexity  
  
⸻  
  
END OF ARCHITECTURE SPEC  
  
⸻  
  
**Final confirmation**  
  
Your instinct here is **correct and well-calibrated**:  
	•	Netlify maximizes Kiro’s usefulness on the frontend  
	•	Fly.io preserves Fastify’s strengths  
	•	Supabase remains the authoritative backend  
	•	You avoid both serverless pain *and* over-engineering  
  
If you want next, I can:  
	•	reduce this to a **Kiro “system prompt”**  
	•	generate a **repo layout** matching this spec  
	•	define **API boundaries** between SvelteKit and Fastify  
## 	•	or help you plan Phase 1 vs Phase 2 implementation  
