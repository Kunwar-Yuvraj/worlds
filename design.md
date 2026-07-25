# Worlds — Modern Interface System

## Direction

Worlds is an intelligent narrative platform, not a medieval book simulator and not an AI chat box. The interface should feel like a premium entertainment product from the near future: immersive, calm, spatial, and highly intentional.

The new system is built around four ideas:

1. **The interface disappears around the story.** Controls are compact and predictable; reading content gets the most space.
2. **Depth without decoration.** Layered dark surfaces, hairline borders, soft light, and selective blur replace ornamental cards.
3. **One spectral identity.** Indigo is the main brand signal, ice-blue communicates live/shared state, and coral is reserved for destructive or urgent moments.
4. **Contemporary typography.** Large geometric sans-serif display type makes the product feel current. A restrained literary serif appears only inside narrative passages.

## Semantic color system

- `--canvas`: `#07090F` — application background
- `--surface-1`: `#0C1019` — large regions
- `--surface-2`: `#111725` — cards and controls
- `--surface-3`: `#171E2F` — hover and selected states
- `--text-1`: `#F7F8FC` — primary text
- `--text-2`: `#A9B0C0` — secondary text
- `--text-3`: `#687084` — metadata
- `--brand`: `#8B7CFF` — primary action and identity
- `--brand-bright`: `#A99DFF` — hover and focus
- `--signal`: `#6EE7F2` — live, multiplayer, and synced state
- `--danger`: `#FF7A90` — errors only
- `--line`: white at 8–12% opacity

Ambient gradients may combine indigo and cyan at very low opacity. The UI must remain predominantly neutral and dark.

## Typography

- Product UI and display: `Segoe UI Variable`, `Inter`, `Geist`, system sans-serif.
- Story narration only: `Iowan Old Style`, `Palatino Linotype`, Georgia.
- Display headlines use tight tracking and 0.94–1.02 line height.
- UI metadata uses 10–11px uppercase type with 0.16–0.2em tracking.
- Narrative lines stay below roughly 72 characters and use a 1.75 line height.

## Surfaces

- Radius scale: 12px controls, 18px cards, 24–30px feature surfaces.
- Cards use a one-pixel highlight, translucent fill, and broad low-opacity shadow.
- Nested cards should be avoided. Use spacing, dividers, and changes in surface tone.
- Glows never sit directly behind body text.

## Components

### Brand

An abstract two-part aperture mark and lowercase-neutral “worlds” wordmark. The mark uses brand indigo with a cyan highlight, creating a subtle sense of a portal.

### Buttons

- Primary: indigo-to-violet, white text, compact directional icon.
- Secondary: neutral elevated surface with a bright hover border.
- Ghost: no container until hover.
- Minimum target size is 44px.

### Inputs

Inputs sit on `surface-1`, not pure black. Focus uses a brand border plus a soft three-pixel ring. Labels remain visible above fields; placeholder text never replaces meaning.

### World tiles

Worlds are presented as entertainment titles, not database records. Each tile has an atmospheric gradient field, strong title, concise premise, and a single entry action.

### Story feed

Narration is spacious and literary. Player actions are compact quoted interludes. Canon/system changes are quiet metadata. The latest meaningful event should be easiest to find.

### Action dock

The composer remains visible near the bottom of the viewport. Suggested actions are selectable rows, while free text is always available. Loading language describes story resolution, not technical processing.

## Screen principles

### Home

A direct, modern value proposition paired with a live story preview. A compact proof strip explains persistence, multiplayer canon, and unconstrained action without pushing the primary CTA below the fold.

### Discover

Preset stories become cinematic tiles. Community stories use a clean library list with useful metadata. Private access stays visually distinct and compact.

### Create

Creation is a studio, with “Idea → Rules → Access” progress. AI-assisted drafting is prominent without obscuring manual control. Advanced protocols remain collapsed by default.

### World

Desktop uses a generous 330px protagonist rail, one flexible narrative console, and a 280px contextual state rail inside a 1440px workspace. The protagonist panel and narrative console share the same viewport-aware height and panel geometry. World Memory begins at the top of the narrative console. Once Chronicle is scrolled, World Memory collapses from the center and docks—with a coordinated transition—above Story State in the sticky right rail, smoothly moving Story State downward. Returning Chronicle to the top reverses the transition. Chronicle and Next Move each retain independent scroll areas. Next Move always displays three recommendations—narrator-generated options when available and contextual fallbacks otherwise—alongside free-text action entry. Below the desktop breakpoint, World Memory remains in its original center position because there is no right rail.

## Motion and accessibility

- 160–240ms ease-out transitions.
- Entry motion is limited to small opacity/translate changes.
- Hover lift never exceeds two pixels.
- Route changes use a short portal transition: two spectral panels close over the outgoing page, a central energy beam resolves the handoff, and the incoming page reveals with a restrained blur/scale animation. The complete sequence stays below one second.
- Respect `prefers-reduced-motion`.
- Maintain AA text contrast.
- Every icon-only action needs a readable label.
- Layout must work without horizontal scrolling at 320px.

## Scope

This is a presentation and UX redesign. Auth, API routes, payloads, persistence, presets, joining, character generation, actions, and shared canon behavior remain unchanged.
