# Graph Report - IBS_PROJECT-TRACKER  (2026-11-03)

## Corpus Check
- 231 files · ~70,474 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 2, .toml 2, .css 1)

## Summary
- 681 nodes · 1771 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 62 edges (avg confidence: 0.84)
- Token cost: 863,610 input · 0 output

## Community Hubs (Navigation)
- Clientes, contactos y modales
- Auth, landing y reuniones
- Proyectos, tareas y vistas
- Tickets y su detalle
- Shell, sidebar y logos
- Arranque app y contexto auth
- Dashboard y métricas
- Dependencias runtime
- Plan marketing 10 clientes
- Dependencias de desarrollo
- Chat realtime (sin uso)
- Config tsconfig.app
- Config shadcn
- package.json y SDKs IA
- Config tsconfig.node
- Reglas graphify (CLAUDE.md)
- Config ESLint
- Build Vite
- Edge Functions de pago
- Scripts check_db/check_users
- Scripts npm
- tsconfig raíz
- deno.json checkout
- deno.json webhook

## God Nodes (most connected - your core abstractions)
1. `react` - 67 edges
2. `lucide-react` - 62 edges
3. `useAuth()` - 38 edges
4. `react-router-dom` - 35 edges
5. `supabase` - 33 edges
6. `Input` - 25 edges
7. `Project` - 24 edges
8. `Ticket` - 21 edges
9. `ProjectDetail()` - 20 edges
10. `usePermissions()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `ECG heartbeat line (white)` --semantically_similar_to--> `SplashScreen()`  [INFERRED] [semantically similar]
  src/public/LogoComplete.webp → src/components/layout/SplashScreen.tsx
- `RoadmapTimelineProps` --references--> `Project`  [EXTRACTED]
  src/components/roadmap/RoadmapTimeline.tsx → src/types/Project.ts
- `IprojectByIbs` --semantically_similar_to--> `ibPulse (page title: ibPulse - By IBSYSTEMS.SRL)`  [INFERRED] [semantically similar]
  README.md → index.html
- `Product: client and project management tool (Asana/Jira alternative)` --conceptually_related_to--> `ibPulse (page title: ibPulse - By IBSYSTEMS.SRL)`  [INFERRED]
  MARKETING_PLAN_10_CLIENTS.md → index.html
- `ibPulse brand name` --semantically_similar_to--> `ibPulse brand name`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **graphify context-retrieval ladder (query/path/explain, wiki index, GRAPH_REPORT)** — claude_graphify_query_command, claude_graphify_path_command, claude_graphify_explain_command, claude_wiki_index_md, claude_graph_report_md [INFERRED 0.85]
- **Founder-led white-glove service as competitive advantage** — marketing_plan_10_clients_concierge_setup, marketing_plan_10_clients_concierge_sales_tactic, marketing_plan_10_clients_vip_whatsapp_founder_support [INFERRED 0.85]
- **Starter/Business tier model across marketing plan and pricing code** — marketing_plan_10_clients_free_starter_tier, marketing_plan_10_clients_paid_business_tier, src_pages_pricingpage, src_hooks_usesubscription, src_components_landing_pricing [INFERRED 0.85]
- **ibPulse logo lockup elements** — src_public_logocomplete_pulse_icon_orange_rounded_square, src_public_logocomplete_ecg_heartbeat_line_white, src_public_logocomplete_ibpulse_wordmark_charcoal, src_public_logocomplete_square_i_dot_orange [EXTRACTED 1.00]
- **ibPulse eye logo lockup (emblem, wordmark, palette)** — src_public_logoibpulse_eye_emblem, src_public_logoibpulse_ibpulse_wordmark, src_public_logoibpulse_red_black_grey_palette [EXTRACTED 1.00]
- **UI surfaces displaying the ibPulse logo** — src_public_logoibpulse, src_layouts_rootlayout, src_components_layout_splashscreen, src_components_layout_sidebar, src_components_landing_navbar, src_components_landing_footer [EXTRACTED 1.00]
- **ibPulse logo lockup (icon, wordmark, red motif, palette)** — src_public_logoibpulse1_pulse_icon, src_public_logoibpulse1_ibpulse_wordmark, src_public_logoibpulse1_red_rounded_square_motif, src_public_logoibpulse1_red_black_white_palette [INFERRED 0.85]
- **ibPulse Pulse-Tile Logo Family (icon-only and wordmark lockups)** — src_public_logo, src_public_logo1, src_public_logocomplete, src_public_logoibpulse1 [INFERRED 0.85]

## Communities (26 total, 4 thin omitted)

### Community 0 - "Clientes, contactos y modales"
Cohesion: 0.06
Nodes (54): lucide-react, react, react-dom, ClientPicker(), ClientPickerProps, ContactPicker(), ContactPickerProps, DeleteClientModal() (+46 more)

### Community 1 - "Auth, landing y reuniones"
Cohesion: 0.05
Nodes (51): date-fns, react-router-dom, ProtectedRoute(), ProtectedRouteProps, features, Features(), Footer(), Hero() (+43 more)

### Community 2 - "Proyectos, tareas y vistas"
Cohesion: 0.06
Nodes (53): react-hot-toast, UploadDocModal(), UploadDocModalProps, ProjectBoardCard(), RoadmapTimeline(), RoadmapTimelineProps, PropertiesPanel(), PropertiesPanelProps (+45 more)

### Community 3 - "Tickets y su detalle"
Cohesion: 0.08
Nodes (32): @hello-pangea/dnd, Column(), ColumnProps, DraggableTicketCard(), DraggableTicketCardProps, KanbanBoard(), KanbanBoardProps, TicketCard() (+24 more)

### Community 4 - "Shell, sidebar y logos"
Cohesion: 0.07
Nodes (33): Sidebar(), SidebarProps, UserProfile(), SplashScreen(), ThemeToggle(), useTheme(), RootLayout(), ChannelPage() (+25 more)

### Community 5 - "Arranque app y contexto auth"
Cohesion: 0.07
Nodes (23): bolt.new, Commented-out og:image and twitter:card meta tags, Favicon, apple-touch-icon and site.webmanifest links, ibPulse (page title: ibPulse - By IBSYSTEMS.SRL), IBSYSTEMS.SRL, module script /src/main.tsx, #root mount point (div id=root), IprojectByIbs (+15 more)

### Community 6 - "Dashboard y métricas"
Cohesion: 0.11
Nodes (25): PermissionGuard(), PermissionGuardProps, colorClasses, StatCard(), StatCardProps, ClientStats, TicketsByClientChart(), TicketsByClientChartProps (+17 more)

### Community 7 - "Dependencias runtime"
Cohesion: 0.07
Nodes (28): dependencies, date-fns@^4.1.0, docx@^9.5.1, @emailjs/browser@^4.4.1, file-saver@^2.0.5, @hello-pangea/dnd@^18.0.1, html2canvas@^1.4.1, jspdf-autotable@^5.0.7 (+20 more)

### Community 8 - "Plan marketing 10 clientes"
Cohesion: 0.15
Nodes (20): Plan Táctico para Conseguir los Primeros 10 Clientes, Asana, Día 9-10: Venta Concierge (migrate Excel or Trello data by next day), Early Adopters acquisition via direct sales and close network, Incentive: 50% lifetime discount or 3 free months of Business, Gratis (Starter) tier: target 50 users, Día 1-2: Beta test con amigos, Irresistible offer for the first 10 customers (+12 more)

### Community 9 - "Dependencias de desarrollo"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer@^10.4.18, baseline-browser-mapping@^2.10.9, eslint@^9.9.1, postcss@^8.4.35, supabase@^2.67.1, tailwindcss@^4.1.18, @types/html2canvas@^0.5.35 (+15 more)

### Community 10 - "Chat realtime (sin uso)"
Cohesion: 0.16
Nodes (14): clsx@^2.1.1, tailwind-merge@^3.4.0, clsx, tailwind-merge, ChatMessageItem(), ChatMessageItemProps, RealtimeChat(), RealtimeChatProps (+6 more)

### Community 11 - "Config tsconfig.app"
Cohesion: 0.10
Nodes (19): baseUrl, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "Config shadcn"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 13 - "package.json y SDKs IA"
Cohesion: 0.12
Nodes (16): class-variance-authority@^0.7.1, @google/genai@^1.34.0, @google/generative-ai@^0.24.1, jspdf@^4.2.1, react-snowfall@^2.4.0, @types/nprogress@^0.2.3, name, private (+8 more)

### Community 14 - "Config tsconfig.node"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+7 more)

### Community 15 - "Reglas graphify (CLAUDE.md)"
Cohesion: 0.30
Nodes (8): graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify explain, graphify knowledge graph (graphify-out/), graphify path, graphify query, graphify update ., graphify-out/wiki/index.md

### Community 16 - "Config ESLint"
Cohesion: 0.18
Nodes (10): @eslint/js@^9.9.1, eslint-plugin-react-hooks@^5.1.0-rc.0, eslint-plugin-react-refresh@^0.4.11, globals@^15.9.0, typescript-eslint@^8.3.0, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+2 more)

### Community 17 - "Build Vite"
Cohesion: 0.20
Nodes (6): @tailwindcss/vite@^4.1.18, vite@^5.4.21, @vitejs/plugin-react@^4.3.1, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 18 - "Edge Functions de pago"
Cohesion: 0.20
Nodes (5): corsHeaders, corsHeaders, stripe, cryptoProvider, stripe

### Community 19 - "Scripts check_db/check_users"
Cohesion: 0.25
Nodes (4): supabase, supabase, @supabase/supabase-js@^2.57.4, @supabase/supabase-js

### Community 20 - "Scripts npm"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, typecheck

### Community 21 - "tsconfig raíz"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, files, references

## Ambiguous Edges - Review These
- `SplashScreen.tsx` → `Logo CSS filter treatments (dark:brightness-200, invert)`  [AMBIGUOUS]
  src/public/Logoibpulse.webp · relation: conceptually_related_to
- `SplashScreen()` → `LogoComplete.webp`  [AMBIGUOUS]
  src/public/LogoComplete.webp · relation: conceptually_related_to
- `useSubscription.ts` → `Pago (Business) tier: target 10 clients`  [AMBIGUOUS]
  MARKETING_PLAN_10_CLIENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `graphify path`, `graphify explain`, `Favicon, apple-touch-icon and site.webmanifest links`, `Trello`, `Orange and charcoal palette` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 175 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Clientes, contactos y modales` to `Auth, landing y reuniones`, `Proyectos, tareas y vistas`, `Tickets y su detalle`, `Shell, sidebar y logos`, `Arranque app y contexto auth`, `Dashboard y métricas`, `Dependencias runtime`, `Chat realtime (sin uso)`, `package.json y SDKs IA`?**
  _High betweenness centrality (0.192) - this node is a cross-community bridge._
- **What connects `graphify path`, `graphify explain`, `Favicon, apple-touch-icon and site.webmanifest links` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Clientes, contactos y modales` be split into smaller, more focused modules?**
  _Cohesion score 0.06275946275946276 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Clientes, contactos y modales` to `Auth, landing y reuniones`, `Proyectos, tareas y vistas`, `Tickets y su detalle`, `Shell, sidebar y logos`, `Dashboard y métricas`, `Dependencias runtime`, `Chat realtime (sin uso)`, `package.json y SDKs IA`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Should `Auth, landing y reuniones` be split into smaller, more focused modules?**
  _Cohesion score 0.05034199726402189 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `SplashScreen.tsx` and `Logo CSS filter treatments (dark:brightness-200, invert)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `SplashScreen()` and `LogoComplete.webp`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._