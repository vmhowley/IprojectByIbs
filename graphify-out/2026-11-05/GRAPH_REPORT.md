# Graph Report - IBS_PROJECT-TRACKER  (2026-11-04)

## Corpus Check
- 245 files · ~101,004 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 2, .toml 2, .webmanifest 1)

## Summary
- 911 nodes · 3123 edges · 41 communities (37 shown, 4 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- react
- index.tsx
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
- utils.ts
- Components
- CalendarPage.tsx
- Home.tsx
- TicketDetailView.tsx
- Ticket
- DemoPage.tsx
- Product
- ProjectDetail.tsx
- format.ts
- useAuth.ts
- types/index.ts
- supabase.ts
- CommandPalette.tsx
- Card.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 121 edges
2. `react` - 76 edges
3. `Button` - 70 edges
4. `lucide-react` - 53 edges
5. `useAuth()` - 50 edges
6. `react-router-dom` - 49 edges
7. `formatDate()` - 46 edges
8. `Avatar()` - 41 edges
9. `ProjectDetail()` - 41 edges
10. `Input` - 36 edges

## Surprising Connections (you probably didn't know these)
- `ECG heartbeat line (white)` --semantically_similar_to--> `SplashScreen()`  [INFERRED] [semantically similar]
  src/public/LogoComplete.webp → src/components/layout/SplashScreen.tsx
- `RoadmapTimelineProps` --references--> `Project`  [EXTRACTED]
  src/components/roadmap/RoadmapTimeline.tsx → src/types/Project.ts
- `ibPulse brand name` --semantically_similar_to--> `ibPulse brand name`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp
- `Red, black and grey palette` --semantically_similar_to--> `Red, black and white palette`  [INFERRED] [semantically similar]
  src/public/Logoibpulse.webp → src/public/Logoibpulse1.webp
- `ibPulse wordmark (bold black sans-serif, red square i-dot)` --semantically_similar_to--> `ibPulse wordmark (bold black sans-serif, red square i-dot)`  [INFERRED] [semantically similar]
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

## Communities (41 total, 4 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (90): react, react-hot-toast, AuthShell(), AuthShellProps, GoogleMark(), ClientPicker(), ClientPickerProps, ContactPicker() (+82 more)

### Community 1 - "index.tsx"
Cohesion: 0.08
Nodes (57): lucide-react, react-router-dom, Action, PageHeader(), PageHeaderProps, ACTION_LABEL, ProjectTimeline(), ProjectTimelineProps (+49 more)

### Community 2 - "cn"
Cohesion: 0.18
Nodes (24): DocNumber(), PropertiesPanel(), PropertiesPanelProps, TASK_GRID, TaskItem, TaskList(), TaskListProps, TaskRow() (+16 more)

### Community 3 - "supabase"
Cohesion: 0.25
Nodes (8): supabase, ActivityLog, activityService, ApiError, handleSupabaseResponse(), Notification, notificationService, projectService

### Community 4 - "PricingPage.tsx"
Cohesion: 0.09
Nodes (24): ProtectedRoute(), ProtectedRouteProps, SplashScreen(), ibPulse App Icon Logo (logo.png), Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white, ibPulse wordmark (bold charcoal sans-serif), Pulse heartbeat icon (white ECG line on orange rounded square), Square i-dot motif (orange rounded square) (+16 more)

### Community 5 - "Arranque app y contexto auth"
Cohesion: 0.09
Nodes (16): bolt.new, Commented-out og:image and twitter:card meta tags, Favicon, apple-touch-icon and site.webmanifest links, ibPulse (page title: ibPulse - By IBSYSTEMS.SRL), IBSYSTEMS.SRL, module script /src/main.tsx, #root mount point (div id=root), IprojectByIbs (+8 more)

### Community 6 - "Projects.tsx"
Cohesion: 0.22
Nodes (14): ProjectBoardCard(), PRIORITY_LABEL, ProjectCard(), Money(), VIEWS, ViewSwitcher(), ViewSwitcherProps, ViewType (+6 more)

### Community 7 - "Dependencias runtime"
Cohesion: 0.06
Nodes (47): dependencies, class-variance-authority@^0.7.1, clsx@^2.1.1, date-fns@^4.1.0, docx@^9.5.1, @emailjs/browser@^4.4.1, file-saver@^2.0.5, @fontsource-variable/archivo@^5.3.0 (+39 more)

### Community 8 - "Pago (Business) tier: target 10 clients"
Cohesion: 0.15
Nodes (20): Plan Táctico para Conseguir los Primeros 10 Clientes, Asana, Día 9-10: Venta Concierge (migrate Excel or Trello data by next day), Early Adopters acquisition via direct sales and close network, Incentive: 50% lifetime discount or 3 free months of Business, Gratis (Starter) tier: target 50 users, Día 1-2: Beta test con amigos, Irresistible offer for the first 10 customers (+12 more)

### Community 9 - "Dependencias de desarrollo"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer@^10.4.18, baseline-browser-mapping@^2.10.9, eslint@^9.9.1, postcss@^8.4.35, supabase@^2.67.1, tailwindcss@^4.1.18, @types/html2canvas@^0.5.35 (+15 more)

### Community 10 - "Sidebar.tsx"
Cohesion: 0.08
Nodes (30): ChatMessageItem(), ChatMessageItemProps, ChatPerson, RealtimeChat(), RealtimeChatProps, MAIN, NavEntry, SidebarProps (+22 more)

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
Cohesion: 0.19
Nodes (17): PermissionGuard(), StatCard(), StatCardProps, StatStrip(), Sidebar(), useAuth(), usePermissions(), canCreate() (+9 more)

### Community 26 - "utils.ts"
Cohesion: 0.07
Nodes (30): features, Features(), steps, Footer(), Hero(), ProductPreview(), SAMPLE, sampleTotals() (+22 more)

### Community 27 - "Components"
Cohesion: 0.05
Nodes (39): Avatars, Board Trays, Buttons, Carbon Paper, Colors, Components, Design System: ibPulse, Do: (+31 more)

### Community 28 - "CalendarPage.tsx"
Cohesion: 0.13
Nodes (20): Ink, INK_CLASS, SIZE, STAMPS, StampSpec, StatusBadgeProps, statusInkClass(), statusLabel() (+12 more)

### Community 29 - "Home.tsx"
Cohesion: 0.19
Nodes (18): CommandPalette(), isAdmin(), relativeHeading(), compareWork(), Home(), LedgerScope, LedgerSort, longDay (+10 more)

### Community 30 - "TicketDetailView.tsx"
Cohesion: 0.15
Nodes (16): fitToContent(), LEGACY_URGENCY, OBJECT_TYPES, QA_OPTIONS, ROUTE, TicketDetailView(), URGENCY_OPTIONS, ModernSelect() (+8 more)

### Community 31 - "Ticket"
Cohesion: 0.23
Nodes (14): @hello-pangea/dnd@^18.0.1, @hello-pangea/dnd, PermissionGuardProps, Column(), ColumnProps, DraggableTicketCard(), DraggableTicketCardProps, KanbanBoard() (+6 more)

### Community 32 - "DemoPage.tsx"
Cohesion: 0.20
Nodes (14): ClientStats, TicketsByClientChart(), TicketsByClientChartProps, ORDER, TicketsByStatusChart(), TicketsByStatusChartProps, MoneyProps, MoneyTotals() (+6 more)

### Community 33 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 34 - "ProjectDetail.tsx"
Cohesion: 0.18
Nodes (12): EditProjectModalProps, NewProjectModalProps, ProjectBoardCardProps, ProjectCardProps, NewTaskModalProps, STATUS_FILTER_OPTIONS, TabId, URGENCY_FILTER_OPTIONS (+4 more)

### Community 35 - "format.ts"
Cohesion: 0.14
Nodes (13): AvatarProps, SIZE, CURRENCY_ORDER, DateStyle, dateTime, dayMonth, FINISHED, initials() (+5 more)

### Community 36 - "useAuth.ts"
Cohesion: 0.23
Nodes (9): AuthContext, AuthProviderProps, authService, subscriptionService, AuthContextType, AuthState, LoginCredentials, SignUpData (+1 more)

### Community 37 - "types/index.ts"
Cohesion: 0.19
Nodes (6): documentService, programService, Comment, TicketProgram, Attachment, Subtask

### Community 38 - "supabase.ts"
Cohesion: 0.32
Nodes (4): Project, Task, CreateMeetingDTO, Meeting

### Community 39 - "CommandPalette.tsx"
Cohesion: 0.29
Nodes (6): CommandPaletteProps, Entry, PAGES, clientService, ticketService, TicketSequence

## Ambiguous Edges - Review These
- `SplashScreen.tsx` → `Logo CSS filter treatments (dark:brightness-200, invert)`  [AMBIGUOUS]
  src/public/Logoibpulse.webp · relation: conceptually_related_to
- `SplashScreen()` → `LogoComplete.webp`  [AMBIGUOUS]
  src/public/LogoComplete.webp · relation: conceptually_related_to
- `useSubscription.ts` → `Pago (Business) tier: target 10 clients`  [AMBIGUOUS]
  MARKETING_PLAN_10_CLIENTS.md · relation: conceptually_related_to

## Knowledge Gaps
- **8 isolated node(s):** `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white`, `Orange Rounded-Square Icon Tile (#EC5D17)`, `Four-Point Sparkle Mark at Bottom-Right Corner (likely AI-generator watermark)` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 295 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `index.tsx`, `ProjectDetail.tsx`, `PricingPage.tsx`, `useAuth.ts`, `Projects.tsx`, `Dependencias runtime`, `CommandPalette.tsx`, `Card.tsx`, `Sidebar.tsx`, `Arranque app y contexto auth`, `Clients.tsx`, `utils.ts`, `CalendarPage.tsx`, `Home.tsx`, `TicketDetailView.tsx`, `Ticket`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **What connects `graphify explain`, `graphify path`, `Brand palette: orange ~#ED7823 and charcoal ~#414242 on off-white` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.05726984126984127 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `cn` to `react`, `DemoPage.tsx`, `index.tsx`, `format.ts`, `ProjectDetail.tsx`, `Projects.tsx`, `CommandPalette.tsx`, `Card.tsx`, `Sidebar.tsx`, `Clients.tsx`, `utils.ts`, `CalendarPage.tsx`, `Home.tsx`, `TicketDetailView.tsx`, `Ticket`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07943037974683544 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `SplashScreen.tsx` and `Logo CSS filter treatments (dark:brightness-200, invert)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `SplashScreen()` and `LogoComplete.webp`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._