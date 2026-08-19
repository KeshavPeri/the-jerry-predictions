# Design reference

## Personality

- Nocturnal
- Refined
- Cool
- Social
- Competitive

The visual thesis is **a private-feeling prediction room made from cool liquid glass**, even though the site is technically public. It should feel like four friends have gathered around one elegant digital table—not like a betting product, fantasy-football clone, admin dashboard, or novelty football site.

The signature element is the set of four participant profiles rendered as restrained luminous glass pennants. A participant's pennant becomes illuminated after locking. That state change, rather than decorative football imagery, supplies the primary moment of gamification.

## References

### Keshav's supplied FPL Advisor image

Borrow:

- the deep blue-black background;
- broad, soft cyan and muted burgundy/purple ambience;
- large translucent navy surfaces;
- thin cool borders and generous corner radii;
- ice-blue headline text and muted blue-grey secondary text;
- bright cyan used sparingly for important numbers and actions;
- calm spacing and a small number of strong surfaces.

Do not copy:

- its page layout;
- its transfer-advice hierarchy;
- its player-grid structure;
- its exact palette values;
- its typography scale or component proportions.

### Football broadcast graphics

Borrow only the clarity of position numbers, scores, concise status labels, and competition zones. Avoid ticker bars, sponsor-heavy presentation, dense stat panels, and television chrome.

### Premium mobile glass interfaces

Borrow layered depth, soft edge highlights, and a single controlled ambient glow. Glass remains a material for grouping and focus; it is not applied to every field and button.

## Typography and colour

### Typography

- **Display and interface:** Sora, with a self-hosted or packaged webfont when practical; fallback `ui-sans-serif, system-ui, sans-serif`.
- **Scores, positions, timestamps, and compact status:** IBM Plex Mono; fallback `ui-monospace, SFMono-Regular, Consolas, monospace`.
- Use sentence case for controls and labels. Reserve uppercase for the small product wordmark and short competition labels.
- Headings use confident size and medium-to-semibold weight, not ultra-bold sports typography.
- Body text uses comfortable line height and never drops below 16px for essential mobile content.
- Mono text is an accent for data, not the main reading face.

### Core palette

| Token | Value | Use |
| --- | --- | --- |
| Night | `#070A14` | Primary page background |
| Deep ink | `#0C1324` | Opaque fallback and nested surfaces |
| Glass | `rgba(29, 40, 68, 0.66)` | Major translucent panels |
| Glass strong | `rgba(24, 34, 59, 0.88)` | Forms and text-heavy mobile surfaces |
| Glass border | `rgba(154, 178, 255, 0.18)` | Quiet panel edge |
| Ice | `#EAF3FF` | Primary text |
| Mist | `#9AA9C7` | Secondary text |
| Violet | `#8B74FF` | Primary action, focus, selected profile |
| Cyan | `#55D6F4` | Saved state, active data, secondary accent |
| Teal | `#43D6B2` | Positive/Conference accent |
| Gold | `#F5C968` | Champion and winner accent |
| Coral | `#FF7187` | Relegation, destructive warning, errors |

Ambient background treatment:

- one diffuse cool-cyan glow from the upper left;
- one diffuse violet-to-muted-plum glow from the right or lower right;
- no animated rainbow gradient;
- no visible gradient banding behind text;
- gradients stay decorative and never encode state.

Glass treatment:

- blur approximately 18–24px on major surfaces where supported;
- thin highlight border rather than a large drop shadow;
- sufficient fill opacity to maintain WCAG AA text contrast;
- large radii on primary cards, smaller radii on fields and buttons;
- an opaque `Deep ink` fallback when backdrop blur is unsupported or reduced transparency is preferred.

### Participant accents

Use restrained accent assignment, while keeping all text contrast independent of colour:

- Keshav: violet
- Anshul: cyan
- Kshitij: teal
- Parth: soft gold

Profiles always show the full name and status; colour and monogram are supplementary.

### Premier League position zones

- champion: gold edge and marker;
- positions 1–5: violet wash;
- positions 6–7: cyan-blue wash;
- position 8: teal wash;
- positions 18–20: coral wash;
- positions 9–17: neutral glass.

Use muted background tints and labelled boundaries. Do not fill rows with saturated colour.

## Interaction principles

### Overall structure

- Mobile-first from 360px; expand rather than redesign on desktop.
- Keep a single clear primary action per screen.
- Preserve participant context at the top of the workspace.
- The prediction workspace uses four tabs: `Premier League table`, `Cup winners`, `Premier League questions`, and `Review & lock`.
- Tabs may scroll horizontally on narrow screens or collapse into an accessible section selector. They must not shrink into unreadable labels.
- Progress communicates `answered of total`, not an error state, because most answers are optional.

### Competition home

- Lead with `THE JERRY PREDICTIONS` and the four participant pennants.
- Show `Not started`, `In progress`, or `Locked` on each profile.
- Show an overall status such as `2 of 4 locked`; do not show a deadline or countdown.
- Ask `Who are you?` in plain language and remember the last choice on the device.
- Permit profile switching without presenting it as secure sign-out.

### Premier League table

- Display fixed position numbers and one reorderable club row per position.
- Primary manipulation is drag-and-drop; every row also offers keyboard- and touch-friendly Move Up and Move Down actions.
- Dragging uses a clear lift state, destination indicator, and announcement for assistive technology.
- Keep club names legible without depending on official badges.
- The initial alphabetical arrangement remains visibly `Not confirmed` until the participant deliberately confirms it.
- A table is either all 20 unique clubs or skipped; never show a partial ranking as complete.

### Cup winners

- Five compact competition cards contain the competition name and a searchable local club field.
- Manual entry is always available when a club is missing.
- Custom trophy illustrations are optional polish and must never block the feature.
- If illustrations are used, they are decorative and locally hosted; the competition name remains the accessible label.

### Premier League questions

- Use a question-card grid: one column on mobile, two on sufficiently wide screens.
- Each card contains one prompt, concise helper text where necessary, and one input.
- Do not crowd every card with its point value. A compact score marker may appear consistently, while full rules live in the scoring reference.
- The Arsenal set-piece card includes an information disclosure with the complete non-penalty definition.
- Categorical fields use local suggestions plus manual fallback; numeric fields use numeric input; match scores use paired home/away fields.

### Review and lock

- Present a full grouped review with direct `Edit` links.
- Unanswered items use `No prediction` and a quiet warning treatment, not an error.
- A completely blank entry cannot proceed.
- Locking is disabled while a save is pending or failed.
- Confirmation says that the entry becomes read-only and requires Keshav to reopen it.
- Use the brief signature animation here: the participant pennant sharpens and illuminates over roughly 400–600ms. Respect reduced motion by switching instantly.

### Locked-predictions hub

- Start with `You're locked in` and the four profile status cards.
- Make locked profiles available as tabs.
- Show waiting profiles without exposing draft content.
- Use one participant entry at a time rather than a dense four-column comparison in V1.
- Update status after a successful refresh or real-time event without shifting the user's current reading position.

### Leaderboard — post-launch

- Rank four participant cards by total score.
- Use a restrained podium treatment for the top three and support joint winners.
- Each card expands to show section totals and every scored prediction.
- Every line explains awarded points; no unexplained aggregate bonuses.
- Show `Results updated` with the latest timestamp.

### Feedback and errors

- Use consistent state language: `Saving`, `Saved`, `Not saved`, `Retry`, `Locked`, `Waiting`, and `Results published`.
- Never imply a failed save succeeded.
- Preserve visible unsaved input on ordinary connection failure and disable locking until it syncs.
- Offline message: explain that the shared competition needs a connection and that changes are not yet shared.
- Service-unavailable message: explain that competition data cannot be reached and offer `Try again`; mention that Keshav may need to resume the competition service only after repeated failure.
- Validation names the exact field and correction. Avoid generic `Something went wrong` messages.
- A corrupted or incomplete shared record must show a safe error state, not fabricate defaults.
- Destructive or state-changing confirmations name the participant affected.

### Accessibility

- Meet WCAG AA contrast for normal and large text.
- Minimum essential body size 16px and minimum touch target 44×44px.
- Visible focus states use both outline and contrast, not glow alone.
- All controls have programmatic names and error associations.
- Status is always conveyed with text or icon plus text, never colour alone.
- Dragging has button and keyboard equivalents and live announcements.
- Dialogs trap focus, close predictably, and return focus to their trigger.
- Honour `prefers-reduced-motion`; avoid parallax and ambient animation.
- Provide an opaque panel fallback for reduced transparency or unsupported backdrop filters.

### Responsive behaviour

- Mobile uses one content column, sticky or easily reachable tab navigation, and full-width primary actions.
- Desktop may use two-column question cards and wider profile/status arrangements.
- The table remains a single vertical ranking at every width.
- Avoid horizontal page scrolling. Only intentional tab strips may scroll horizontally.
- Long club and player names wrap or truncate with an accessible full label; they never overlap controls.
- Test current Safari on iPhone, Chrome on Android, and current Chrome/Safari/Firefox/Edge desktop behaviour in proportion to availability.

## Avoid

- football clip art, emoji, fake grass, stadium wallpaper, floodlight beams, or pitch-texture backgrounds;
- betting language, odds, casino mechanics, coins, XP, streaks, or cash-like rewards;
- team-biased Arsenal-red versus Chelsea-blue branding across the product;
- official club or trophy imagery as a launch dependency;
- glass on every nested element;
- low-opacity text justified as atmospheric;
- excessive blur, glow, neon outlines, or multicolour gradients;
- permanent animation, pulsing buttons, parallax, or repeated confetti;
- generic dashboard stat cards that do not help make or compare predictions;
- dense four-participant comparison matrices on mobile;
- tiny all-caps labels, ultra-condensed body type, or mono body paragraphs;
- colour-only qualification bands, lock states, progress, or errors;
- copy that implies privacy, authentication, or verified identity;
- ambiguous buttons such as `Submit`; use `Lock my predictions`, `Save`, `Retry`, and `Publish results` consistently;
- polishing optional art before storage, locking, reveal, and accessibility are reliable.
