# Graph Report - IBS_PROJECT-TRACKER  (2026-11-05)

## Corpus Check
- 255 files · ~107,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .toml 2, .webmanifest 1)

## Summary
- 929 nodes · 3223 edges · 45 communities (37 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1041382c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- RootLayout.tsx
- cn
- supabase
- Logo
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
- lucide-react
- Product
- ProjectDetail.tsx
- formatDate
- useAuth.ts
- types/index.ts
- @google/genai@^1.34.0
- TasksPage.tsx
- StatusBadge.tsx
- docx
- html2canvas@^1.4.1
- tailwind-merge
- @types/file-saver@^2.0.7

## God Nodes (most connected - your core abstractions)
1. `cn()` - 121 edges
2. `react` - 78 edges
3. `Button` - 72 edges
4. `lucide-react` - 55 edges
5. `react-router-dom` - 50 edges
6. `useAuth()` - 50 edges
7. `formatDate()` - 48 edges
8. `ProjectDetail()` - 43 edges
9. `Avatar()` - 42 edges
10. `Home()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `ECG heartbeat line (white)` --semantically_similar_to--> `SplashScreen()`  [INFERRED] [semantically similar]
  src/public/LogoComplete.webp → src/components/layout/SplashScreen.tsx
- `RoadmapTimelineProps` --references--> `Project`  [EXTRACTED]
  src/components/roadmap/RoadmapTimeline.tsx → src/types/Project.ts
- `TicketDetailViewProps` --references--> `Ticket`  [EXTRACTED]
  src/components/ticket/TicketDetailView.tsx → src/types/Ticket.ts
- `loadUsers()` --calls--> `getUsers()`  [EXTRACTED]
  src/components/ui/UserPicker.tsx → src/services/usersService.ts
- `ibPulse brand name` --semantically_similar_to--> `ibPulse brand name`  [INFERRED] [semantically similar]
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

## Communities (45 total, 8 thin omitted)

### Community 0 - "react"
Cohesion: 0.08
Nodes (64): react, AuthShell(), AuthShellProps, GoogleMark(), ClientPicker(), ClientPickerProps, ContactPicker(), ContactPickerProps (+56 more)

### Community 1 - "RootLayout.tsx"
Cohesion: 0.36
Nodes (5): Navbar(), RootLayout(), createProjectWithFiles(), projectService, storageService

### Community 2 - "cn"
Cohesion: 0.14
Nodes (21): PropertiesPanel(), PropertiesPanelProps, TASK_GRID, TaskItem, TaskList(), TaskListProps, TaskRow(), TaskRowProps (+13 more)

### Community 3 - "supabase"
Cohesion: 0.26
Nodes (9): supabase, ActivityLog, activityService, ApiError, handleSupabaseResponse(), contactService, Notification, notificationService (+1 more)

### Community 4 - "Logo"
Cohesion: 0.06
Nodes (38): ProtectedRoute(), ProtectedRouteProps, features, Features(), steps, Footer(), Hero(), ProductPreview() (+30 more)

### Community 5 - "Arranque app y contexto auth"
Cohesion: 0.06
Nodes (28): bolt.new, Commented-out og:image and twitter:card meta tags, Favicon, apple-touch-icon and site.webmanifest links, ibPulse (page title: ibPulse - By IBSYSTEMS.SRL), IBSYSTEMS.SRL, module script /src/main.tsx, #root mount point (div id=root), react-dom@^19.2.3 (+20 more)

### Community 6 - "Projects.tsx"
Cohesion: 0.18
Nodes (22): DocNumber(), ProjectBoardCard(), PRIORITY_LABEL, ProjectCard(), Avatar(), AvatarProps, hueFor(), HUES (+14 more)

### Community 7 - "Dependencias runtime"
Cohesion: 0.07
Nodes (30): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, @emailjs/browser@^4.4.1, file-saver@^2.0.5, @fontsource-variable/archivo@^5.3.0, @fontsource-variable/red-hat-mono@^5.3.0 (+22 more)

### Community 8 - "Pago (Business) tier: target 10 clients"
Cohesion: 0.10
Nodes (24): Plan Táctico para Conseguir los Primeros 10 Clientes, Asana, Día 9-10: Venta Concierge (migrate Excel or Trello data by next day), Early Adopters acquisition via direct sales and close network, Incentive: 50% lifetime discount or 3 free months of Business, Gratis (Starter) tier: target 50 users, Día 1-2: Beta test con amigos, Irresistible offer for the first 10 customers (+16 more)

### Community 9 - "Dependencias de desarrollo"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.18, baseline-browser-mapping@^2.10.9, eslint@^9.9.1, postcss@^8.4.35, supabase@^2.67.1, tailwindcss@^4.1.18, @types/html2canvas@^0.5.35 (+19 more)

### Community 10 - "Sidebar.tsx"
Cohesion: 0.09
Nodes (31): ChatMessageItem(), ChatMessageItemProps, ChatPerson, RealtimeChat(), RealtimeChatProps, MAIN, NavEntry, SidebarProps (+23 more)

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
Cohesion: 0.23
Nodes (16): StatCard(), StatCardProps, StatStrip(), Skeleton(), SkeletonRows(), BoardViewProps, Column, ColumnDef (+8 more)

### Community 26 - "index.tsx"
Cohesion: 0.20
Nodes (15): UserMenu(), TicketDetailView(), useAuth(), useSubscription(), AdminPanel(), loadUsers(), MeetingDetail(), MessagesPage() (+7 more)

### Community 27 - "Components"
Cohesion: 0.05
Nodes (41): Avatars, Board Trays, Buttons, Carbon Paper, Charts, Colors, Components, Design System: ibPulse (+33 more)

### Community 28 - "CalendarPage.tsx"
Cohesion: 0.10
Nodes (27): statusInkClass(), AgendaChip(), AgendaItem, AgendaRow(), CalendarPage(), capitalize(), dayKey(), dayTitle (+19 more)

### Community 29 - "Home.tsx"
Cohesion: 0.12
Nodes (26): LedgerProjectRows(), ClientStats, TicketsByClientChart(), TicketsByClientChartProps, ORDER, TicketsByStatusChart(), TicketsByStatusChartProps, MoneyProps (+18 more)

### Community 30 - "AdminPanel.tsx"
Cohesion: 0.29
Nodes (4): updateUserRole(), Role, roleLabel(), ROLES

### Community 31 - "Ticket"
Cohesion: 0.33
Nodes (11): @hello-pangea/dnd, Column(), ColumnProps, DraggableTicketCard(), DraggableTicketCardProps, KanbanBoard(), KanbanBoardProps, TRAYS (+3 more)

### Community 32 - "lucide-react"
Cohesion: 0.13
Nodes (16): @google/generative-ai@^0.24.1, @google/generative-ai, lucide-react, react-router-dom, Action, PageHeaderProps, MeetingRecorder(), FAQItem (+8 more)

### Community 33 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 34 - "ProjectDetail.tsx"
Cohesion: 0.07
Nodes (52): react-hot-toast, PermissionGuard(), PermissionGuardProps, LedgerProjectRowsProps, UploadDocModalProps, Sidebar(), EditProjectModalProps, moveToQuote() (+44 more)

### Community 35 - "formatDate"
Cohesion: 0.18
Nodes (23): PageHeader(), ACTION_LABEL, ProjectTimeline(), ProjectTimelineProps, BAR, LEGEND, monthLabel(), RoadmapTimeline() (+15 more)

### Community 36 - "useAuth.ts"
Cohesion: 0.24
Nodes (9): AuthContext, AuthProviderProps, authService, subscriptionService, AuthContextType, AuthState, LoginCredentials, SignUpData (+1 more)

### Community 37 - "types/index.ts"
Cohesion: 0.12
Nodes (15): fitToContent(), LEGACY_URGENCY, OBJECT_TYPES, QA_OPTIONS, ROUTE, TicketDetailViewProps, URGENCY_OPTIONS, commentService (+7 more)

### Community 39 - "TasksPage.tsx"
Cohesion: 0.21
Nodes (14): CommandPalette(), CommandPaletteProps, Entry, PAGES, QuickTaskData, URGENCY_RANK, View, VIEWS (+6 more)

### Community 40 - "StatusBadge.tsx"
Cohesion: 0.25
Nodes (7): Ink, INK_CLASS, SIZE, STAMP_INK, STAMPS, StampSpec, StatusBadgeProps

## Ambiguous Edges - Review These
- `SplashScreen.tsx` → `Logo CSS filter treatments (dark:brightness-200, invert)`  [AMBIGUOUS]
  src/public/Logoibpulse.webp · relation: conceptually_related_to
- `SplashScreen()` → `LogoComplete.webp`  [AMBIGUOUS]
  src/public/LogoComplete.webp · relation: conceptually_related_to
- `useSubscription.ts` → `Pago (Business) tier: target 10 clients`  [AMBIGUOUS]
  MARKETING_PLAN_10_CLIENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white`, `Orange Rounded-Square Icon Tile (#EC5D17)`, `Four-Point Sparkle Mark at Bottom-Right Corner (likely AI-generator watermark)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 301 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `RootLayout.tsx`, `cn`, `Logo`, `Arranque app y contexto auth`, `Projects.tsx`, `Dependencias runtime`, `Pago (Business) tier: target 10 clients`, `Dependencias de desarrollo`, `Sidebar.tsx`, `Clients.tsx`, `index.tsx`, `CalendarPage.tsx`, `Home.tsx`, `AdminPanel.tsx`, `lucide-react`, `ProjectDetail.tsx`, `formatDate`, `useAuth.ts`, `types/index.ts`, `TasksPage.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **What connects `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.08150470219435736 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `Clients.tsx` to `react`, `RootLayout.tsx`, `ProjectDetail.tsx`, `lucide-react`, `Logo`, `Arranque app y contexto auth`, `Projects.tsx`, `TasksPage.tsx`, `Pago (Business) tier: target 10 clients`, `formatDate`, `Sidebar.tsx`, `cn`, `types/index.ts`, `StatusBadge.tsx`, `index.tsx`, `CalendarPage.tsx`, `Home.tsx`, `Ticket`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `SplashScreen.tsx` and `Logo CSS filter treatments (dark:brightness-200, invert)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `SplashScreen()` and `LogoComplete.webp`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._