# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the IB Systems team** (IBSYSTEMS.SRL, Dominican Republic). Consultants, developers and admins use ibPulse on desktop computers for the whole workday. They track client projects and their tickets, and admins follow how much each project and each client is worth.
- **Client contacts** (role `guest`) see only their client's projects and tickets. They comment and approve or return tickets that wait for approval.
- **Support agents** (role `support_agent`) answer the in-app support chat and see every tenant.
- **Prospects** reach the landing and pricing pages. They are small digital agencies, freelance developers and designers, and consultants, per `MARKETING_PLAN_10_CLIENTS.md`.

## Product Purpose

ibPulse tracks projects and tasks (tickets) per client, and puts the price of each project next to that work. Success means a team member knows what to do today, and an admin knows how much each client represents, without leaving the app.

## Positioning

From the marketing plan, not yet validated with customers:

- Unlimited users for a fixed price, unlike per-seat tools such as Asana and Jira.
- Clients are invited in to follow progress and approve work.
- Concierge migration of the first customers' data.

## Operating Context

- Spanish interface for a Dominican team. Amounts come in the project's currency (`projects.currency`), for example DOP or USD.
- Desktop, full workday. The phone must work well but is not the primary device.
- Main flow: client, then project, then tickets. Ticket statuses: `pending_analysis`, `pending_approval`, `approved`, `ongoing`, `completed`, `done`.
- Ticket detail holds subtasks, comments, attachments, QA status and notes, and "programs" (object name, type and attribute). It also exports a production-pass document.
- Projects hold documents, an activity log, members and a timeline.
- Meetings are recorded, transcribed and summarized with AI. Roadmaps show projects on a timeline.
- Team channels are grouped by email domain. There are a notifications inbox, a support chat with agents, an admin panel, and settings such as ticket request types.
- Roles: `admin`, `user`, `guest`, `support_agent`. Tenancy follows the confirmed email domain.
- Subscriptions: Free and Pro, through Stripe and Azul.

## Capabilities and Constraints

- Stack: React 19, Vite, Tailwind CSS v4, Supabase with row-level security, lucide icons.
- **Money:** the only stored amount is `projects.cost` with `projects.currency`, the price the client pays. There is no internal cost, payment or invoice data, so the app can show billed value but not margin, collected or pending amounts. Confirmed scope for this redesign: show what exists, with no database changes.
- Never add amounts in different currencies without an explicit conversion.
- **Open decision:** price visibility per role. Today only the interface limits it; row-level security does not hide `cost` from non-admins.
- Every existing feature stays reachable. Confirmed for this redesign:
  - Connect the useful unused code: direct messages get their own page, the project board gets drag and drop (`components/kanban`), the calendar shows real deadlines, and shared pieces (Modal, Navbar and others) are reused.
  - Remove the empty placeholder routes: `/saved`, `/design`, `/marketing`, `/engineering/:section`.
- Light and dark themes exist and users can switch between them.

## Brand Commitments

- Name **ibPulse**, signed "By IBSYSTEMS.SRL".
- Logo in use: `src/public/Logoibpulse.webp`. It has a red mark, a black wordmark, and a red square dot on the "i". Two unused variants have an ECG mark: `LogoComplete.webp` (orange) and `Logoibpulse1.webp` (red).
- The brand color is the logo red.
- Voice: Spanish, direct and practical.

## Evidence on Hand

- Production holds real data: 8 users, 74 projects, 214 tickets, 8 clients and 35 contacts. Never show it on public pages.
- The landing lists plans Starter ($0/mes), Pro ($29/mes) and Business. Confirm prices with the owner before reusing them.
- There are no testimonials, customer logos, product screenshots or usage metrics. The landing hero mockup is a placeholder. Do not fabricate any of these.

## Product Principles

1. Money per client leads: every client and project surface answers what that work is worth, in its own currency.
2. Density serves operators: status, deadlines, owners and amounts are readable at a glance on a desktop screen.
3. The client is part of the workflow but only sees what belongs to them.
4. Nothing is orphaned: every feature has a clear place in navigation.
5. No invented numbers: metrics come from real data or are not shown.

## Accessibility & Inclusion

- The interface language is Spanish (`lang="es"`).
- Every action works with the keyboard and on touch screens; none depends on hover alone.
- Text meets WCAG AA contrast in both themes.
