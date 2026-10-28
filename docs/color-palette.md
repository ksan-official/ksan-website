# KSAN color palette

Shared tokens live in `src/app/globals.css`. Use these tokens in public pages, detail pages, account screens, and admin UI rather than adding isolated hex values.

| Token | Value | Role |
| --- | --- | --- |
| `--brand-dutch-orange` | `#F36C21` | Primary actions, active controls, brand illustrations |
| `--brand-orange-strong` | `#BE4B13` | Orange text on light backgrounds |
| `--brand-orange-hover` | `#DC5D18` | Orange hover states |
| `--brand-orange-200` | `#FFC18F` | Illustration shading |
| `--brand-soft-peach` | `#FFF0E5` | Selected tags, warm supporting surfaces |
| `--brand-blue-400` | `#5268E8` | Secondary graphic accents |
| `--brand-blue-strong` | `#354CC5` | Blue text on light backgrounds |
| `--brand-ice-blue` | `#E9EDFF` | Information panels, blue tags |
| `--brand-soft-mint` | `#DCEEE5` | Community and positive supporting surfaces |
| `--brand-mint-strong` | `#326B53` | Positive status text, mint tags |
| `--bg`, `--surface` | `#FFFFFF` | Page and card canvas |
| `--surface-soft` | `#F4F5F7` | Search inputs, neutral cards |
| `--line` | `#E3E6EC` | Borders and separators |
| `--text` | `#242730` | Primary text |
| `--muted`, `--faint` | `#676E7C` | Supporting readable text |
| `--brand-error` | `#B83C3C` | Error states |

## Usage

- Keep orange as the primary interaction color across every section. Blue and mint support it rather than creating independent page themes.
- Use soft peach, light blue, and soft mint for large supporting surfaces; use stronger variants for small text.
- Use `--on-accent` for text on a solid primary orange background. Dark backgrounds and strong blue backgrounds use white text.
- Preserve photographs, sponsor logos, third-party branding, and user-generated content in their original colors.
- Maintain success and error distinctions independently of decorative color choices; accompany statuses with text or icons.
