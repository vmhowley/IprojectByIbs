# Graph Report - IBS_PROJECT-TRACKER  (2026-11-05)

## Corpus Check
- 245 files · ~102,426 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .toml 2, .webmanifest 1)

## Summary
- 916 nodes · 3130 edges · 40 communities (37 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- react
- ProjectDetail
- cn
- supabase
- PricingPage.tsx
- Arranque app y contexto auth
- Projects.tsx
- Dependencias runtime
- Pago (Business) tier: target 10 clients
- Dependencias de desarrollo
- Sidebar.tsx
- Config tsconfig.app
- Config shadcn
- DashboardExport.ts
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
- Clients.tsx
- index.tsx
- Components
- CalendarPage.tsx
- Home.tsx
- AdminPanel.tsx
- Ticket
- aiService.ts
- Product
- ProjectDetail.tsx
- format.ts
- useAuth.ts
- types/index.ts
- @emailjs/browser@^4.4.1
- TasksPage.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 121 edges
2. `react` - 77 edges
3. `Button` - 70 edges
4. `lucide-react` - 53 edges
5. `useAuth()` - 50 edges
6. `react-router-dom` - 49 edges
7. `formatDate()` - 46 edges
8. `Avatar()` - 42 edges
9. `ProjectDetail()` - 41 edges
10. `Input` - 36 edges

## Surprising Connections (you probably didn't know these)
- `ECG heartbeat line (white)` --semantically_similar_to--> `SplashScreen()`  [INFERRED] [semantically similar]
  src/public/LogoComplete.webp → src/components/layout/SplashScreen.tsx
- `ibPulse brand name` --semantically_similar_to--> `ibPulse brand name`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp
- `Red, black and grey palette` --semantically_similar_to--> `Red, black and white palette`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp
- `ibPulse wordmark (bold black sans-serif, red square i-dot)` --semantically_similar_to--> `ibPulse wordmark (bold black sans-serif, red square i-dot)`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp
- `Eye emblem (red swooshes around grey sphere pupil)` --semantically_similar_to--> `Pulse icon (white ECG line on red rounded square)`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp

## Import Cycles
- 2-file cycle: `src/components/task/TaskList.tsx -> src/components/task/TaskRow.tsx -> src/components/task/TaskList.tsx`

## Hyperedges (group relationships)
- **ibPulse eye logo lockup (emblem, wordmark, palette)** — src_public_logoibpulse_eye_emblem, src_public_logoibpulse_ibpulse_wordmark, src_public_logoibpulse_red_black_grey_palette [EXTRACTED 1.00]
- **UI surfaces displaying the ibPulse logo** — src_public_logoibpulse, src_layouts_rootlayout, src_components_layout_splashscreen, src_components_layout_sidebar, src_components_landing_navbar, src_components_landing_footer [EXTRACTED 1.00]
- **ibPulse logo lockup elements** — src_public_logocomplete_pulse_icon_orange_rounded_square, src_public_logocomplete_ecg_heartbeat_line_white, src_public_logocomplete_ibpulse_wordmark_charcoal, src_public_logocomplete_square_i_dot_orange [EXTRACTED 1.00]
- **graphify context-retrieval ladder (query/path/explain, wiki index, GRAPH_REPORT)** — claude_graphify_query_command, claude_graphify_path_command, claude_graphify_explain_command, claude_wiki_index_md, claude_graph_report_md [INFERRED 0.85]
- **ibPulse logo lockup (icon, wordmark, red motif, palette)** — src_public_logoibpulse1_pulse_icon, src_public_logoibpulse1_ibpulse_wordmark, src_public_logoibpulse1_red_rounded_square_motif, src_public_logoibpulse1_red_black_white_palette [INFERRED 0.85]
- **ibPulse Pulse-Tile Logo Family (icon-only and wordmark lockups)** — src_public_logo, src_public_logo1, src_public_logocomplete, src_public_logoibpulse1 [INFERRED 0.85]
- **Founder-led white-glove service as competitive advantage** — marketing_plan_10_clients_concierge_setup, marketing_plan_10_clients_concierge_sales_tactic, marketing_plan_10_clients_vip_whatsapp_founder_support [INFERRED 0.85]
- **Starter/Business tier model across marketing plan and pricing code** — marketing_plan_10_clients_free_starter_tier, marketing_plan_10_clients_paid_business_tier, src_pages_pricingpage, src_hooks_usesubscription, src_components_landing_pricing [INFERRED 0.85]

## Communities (40 total, 3 thin omitted)

### Community 0 - "react"
Cohesion: 0.07
Nodes (79): react, react-hot-toast, ClientPicker(), ClientPickerProps, ContactPicker(), ContactPickerProps, DeleteClientModal(), DeleteClientModalProps (+71 more)

### Community 1 - "ProjectDetail"
Cohesion: 0.19
Nodes (18): Action, DocNumber(), PageHeader(), PageHeaderProps, EmptyState(), TableView(), DocumentationPage(), DocWithProject (+10 more)

### Community 2 - "cn"
Cohesion: 0.13
Nodes (31): PropertiesPanel(), PropertiesPanelProps, TASK_GRID, TaskItem, TaskList(), TaskListProps, TaskRow(), TaskRowProps (+23 more)

### Community 3 - "supabase"
Cohesion: 0.25
Nodes (9): ACTION_LABEL, ProjectTimelineProps, supabase, ActivityLog, activityService, ApiError, handleSupabaseResponse(), commentService (+1 more)

### Community 4 - "PricingPage.tsx"
Cohesion: 0.10
Nodes (21): ibPulse App Icon Logo (logo.png), Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white, ibPulse wordmark (bold charcoal sans-serif), Pulse heartbeat icon (white ECG line on orange rounded square), Square i-dot motif (orange rounded square), Orange Rounded-Square Icon Tile (#EC5D17), Four-Point Sparkle Mark at Bottom-Right Corner (likely AI-generator watermark), White Pulse (ECG Heartbeat) Waveform Glyph (+13 more)

### Community 5 - "Arranque app y contexto auth"
Cohesion: 0.06
Nodes (25): bolt.new, Commented-out og:image and twitter:card meta tags, Favicon, apple-touch-icon and site.webmanifest links, ibPulse (page title: ibPulse - By IBSYSTEMS.SRL), IBSYSTEMS.SRL, module script /src/main.tsx, #root mount point (div id=root), react-dom@^19.2.3 (+17 more)

### Community 6 - "Projects.tsx"
Cohesion: 0.16
Nodes (21): ProjectBoardCard(), PRIORITY_LABEL, ProjectCard(), Money(), MoneyProps, MoneyTotals(), MoneyTotalsProps, VIEWS (+13 more)

### Community 7 - "Dependencias runtime"
Cohesion: 0.06
Nodes (34): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, docx@^9.5.1, file-saver@^2.0.5, @fontsource-variable/archivo@^5.3.0, @fontsource-variable/red-hat-mono@^5.3.0 (+26 more)

### Community 8 - "Pago (Business) tier: target 10 clients"
Cohesion: 0.15
Nodes (20): Plan Táctico para Conseguir los Primeros 10 Clientes, Asana, Día 9-10: Venta Concierge (migrate Excel or Trello data by next day), Early Adopters acquisition via direct sales and close network, Incentive: 50% lifetime discount or 3 free months of Business, Gratis (Starter) tier: target 50 users, Día 1-2: Beta test con amigos, Irresistible offer for the first 10 customers (+12 more)

### Community 9 - "Dependencias de desarrollo"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.18, baseline-browser-mapping@^2.10.9, eslint@^9.9.1, postcss@^8.4.35, supabase@^2.67.1, tailwindcss@^4.1.18, @types/html2canvas@^0.5.35 (+19 more)

### Community 10 - "Sidebar.tsx"
Cohesion: 0.08
Nodes (33): lucide-react, ChatMessageItem(), ChatMessageItemProps, ChatPerson, RealtimeChat(), RealtimeChatProps, SupportChatWidget(), EmptyStateProps (+25 more)

### Community 11 - "Config tsconfig.app"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleDetection (+11 more)

### Community 12 - "Config shadcn"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 13 - "DashboardExport.ts"
Cohesion: 0.17
Nodes (11): jspdf@^4.2.1, jspdf-autotable@^5.0.7, jspdf, jspdf-autotable, BRAND, DashboardData, INK, INK_3 (+3 more)

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

### Community 24 - "Clients.tsx"
Cohesion: 0.18
Nodes (16): StatCard(), StatCardProps, StatStrip(), Skeleton(), SkeletonRows(), ColumnDef, HIDE, TableViewProps (+8 more)

### Community 26 - "index.tsx"
Cohesion: 0.06
Nodes (54): react-router-dom, AuthShell(), AuthShellProps, GoogleMark(), PermissionGuard(), ProtectedRoute(), ProtectedRouteProps, features (+46 more)

### Community 27 - "Components"
Cohesion: 0.05
Nodes (41): Avatars, Board Trays, Buttons, Carbon Paper, Charts, Colors, Components, Design System: ibPulse (+33 more)

### Community 28 - "CalendarPage.tsx"
Cohesion: 0.13
Nodes (25): Ink, INK_CLASS, SIZE, STAMP_INK, STAMPS, StampSpec, StatusBadgeProps, statusInkClass() (+17 more)

### Community 29 - "Home.tsx"
Cohesion: 0.14
Nodes (20): ClientStats, TicketsByClientChart(), TicketsByClientChartProps, ORDER, TicketsByStatusChart(), TicketsByStatusChartProps, CommandPalette(), compareWork() (+12 more)

### Community 30 - "AdminPanel.tsx"
Cohesion: 0.23
Nodes (8): loadUsers(), AdminPanel(), loadUsers(), updateUserRole(), Role, roleLabel(), ROLES, getUsers()

### Community 31 - "Ticket"
Cohesion: 0.30
Nodes (12): @hello-pangea/dnd, Column(), ColumnProps, DraggableTicketCard(), DraggableTicketCardProps, KanbanBoard(), KanbanBoardProps, TRAYS (+4 more)

### Community 32 - "aiService.ts"
Cohesion: 0.29
Nodes (5): @google/generative-ai@^0.24.1, @google/generative-ai, aiService, generateWithRetry(), getWorkingModel()

### Community 33 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 34 - "ProjectDetail.tsx"
Cohesion: 0.27
Nodes (7): STATUS_FILTER_OPTIONS, TabId, URGENCY_FILTER_OPTIONS, contactService, documentationService, storageService, ProjectDocument

### Community 35 - "format.ts"
Cohesion: 0.11
Nodes (27): nprogress@^0.2.0, nprogress, ProjectTimeline(), BAR, LEGEND, monthLabel(), RoadmapTimeline(), dayLabel() (+19 more)

### Community 36 - "useAuth.ts"
Cohesion: 0.24
Nodes (9): AuthContext, AuthProviderProps, authService, subscriptionService, AuthContextType, AuthState, LoginCredentials, SignUpData (+1 more)

### Community 37 - "types/index.ts"
Cohesion: 0.14
Nodes (13): fitToContent(), LEGACY_URGENCY, OBJECT_TYPES, QA_OPTIONS, ROUTE, URGENCY_OPTIONS, documentService, programService (+5 more)

### Community 38 - "@emailjs/browser@^4.4.1"
Cohesion: 0.33
Nodes (4): @emailjs/browser@^4.4.1, @google/genai@^1.34.0, @emailjs/browser, @google/genai

### Community 39 - "TasksPage.tsx"
Cohesion: 0.12
Nodes (19): PermissionGuardProps, CommandPaletteProps, Entry, PAGES, EditProjectModalProps, NewProjectModalProps, ProjectBoardCardProps, ProjectCardProps (+11 more)

## Ambiguous Edges - Review These
- `SplashScreen.tsx` → `Logo CSS filter treatments (dark:brightness-200, invert)`  [AMBIGUOUS]
  src/public/Logoibpulse.webp · relation: conceptually_related_to
- `SplashScreen()` → `LogoComplete.webp`  [AMBIGUOUS]
  src/public/LogoComplete.webp · relation: conceptually_related_to
- `useSubscription.ts` → `Pago (Business) tier: target 10 clients`  [AMBIGUOUS]
  MARKETING_PLAN_10_CLIENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white`, `Orange Rounded-Square Icon Tile (#EC5D17)`, `Four-Point Sparkle Mark at Bottom-Right Corner (likely AI-generator watermark)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 299 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `ProjectDetail`, `cn`, `supabase`, `format.ts`, `types/index.ts`, `Arranque app y contexto auth`, `Dependencias runtime`, `TasksPage.tsx`, `Dependencias de desarrollo`, `Sidebar.tsx`, `Projects.tsx`, `useAuth.ts`, `ProjectDetail.tsx`, `Clients.tsx`, `index.tsx`, `CalendarPage.tsx`, `Home.tsx`, `AdminPanel.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06552006552006552 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `react`, `ProjectDetail`, `ProjectDetail.tsx`, `format.ts`, `types/index.ts`, `Projects.tsx`, `TasksPage.tsx`, `Arranque app y contexto auth`, `Sidebar.tsx`, `Clients.tsx`, `index.tsx`, `CalendarPage.tsx`, `Home.tsx`, `Ticket`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.1329268292682927 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `SplashScreen.tsx` and `Logo CSS filter treatments (dark:brightness-200, invert)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `SplashScreen()` and `LogoComplete.webp`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._