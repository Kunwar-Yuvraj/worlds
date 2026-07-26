# reactJK UI System

reactJK uses one visual language across Kalamish and Worlds, joining long-form creation with interactive story participation.

## Direction

- Premium near-future narrative software: atmospheric, precise, and calm.
- The manuscript is always the primary surface. Navigation and AI tools frame it without competing with it.
- Interfaces use layered dark surfaces, restrained violet/cyan light, fine borders, and generous spatial rhythm.
- Serif typography is reserved for story prose and narrative excerpts. Product UI remains sans-serif.

## Core palette

| Token | Value | Use |
| --- | --- | --- |
| Canvas | `#07090F` | Page background |
| Surface 1 | `#0C1019` | Primary panels |
| Surface 2 | `#111725` | Raised controls and editor highlight |
| Surface 3 | `#171E2F` | Hover and selected layers |
| Text 1 | `#F7F8FC` | Primary text |
| Text 2 | `#A9B0C0` | Secondary text |
| Text 3 | `#687084` | Metadata and quiet labels |
| Brand | `#8B7CFF` | Primary actions and focus |
| Brand bright | `#A99DFF` | Highlights |
| Signal | `#6EE7F2` | Live/synced states |
| Danger | `#FF7A90` | Destructive actions |

Borders use white at 8–12% opacity. Glows are soft and local; they should never reduce text contrast.

## Typography

- UI: Inter/system sans-serif.
- Manuscript and narrative excerpts: Iowan Old Style, Palatino, Georgia fallback.
- Page titles: 28–48px depending on context.
- Section titles: 16–20px.
- Metadata: 10–11px, uppercase, increased tracking.
- Manuscript: 17px with a 31px line height.

## Shape and depth

- Controls: 10–12px radius.
- Cards and workspace panels: 18–22px radius.
- Hero/auth surfaces: 24–30px radius.
- Use fine borders plus subtle inset highlights instead of heavy drop shadows.

## Motion

- Standard transitions: 160–240ms with an ease-out curve.
- Hover lift is capped at 2px.
- Route changes use a short reveal and a faint horizontal beam.
- Background orbital motion is decorative and slow.
- All decorative motion is disabled with `prefers-reduced-motion`.

## Responsive behavior

- Desktop workspace uses activity rail, context sidebar, manuscript, and optional Muse panel.
- On smaller screens the context sidebar and Muse become fixed drawers.
- The activity rail becomes a bottom dock.
- Dense headers wrap and secondary labels collapse before primary actions.
- Touch targets stay at least 36–44px.

## Component rules

- Primary buttons use a violet gradient and white text.
- Quiet buttons use translucent surfaces with a fine border.
- Inputs are 48px tall on auth/dashboard screens and use a violet focus ring.
- Cards use the shared `glass-card` treatment.
- AI is called **Muse** in the workspace and uses the live cyan indicator.
- Success/synced states use cyan or emerald; violet is reserved for selection and creation.
