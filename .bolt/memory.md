# Project memory

## Product intent & audience

- Expert database management web app for Chinese highway/waterway engineering review panels.
- Core domains: expert database, institutional certificates, observer pools, automated expert selection algorithms.
- Audience: administrators running expert panel formation with qualification-matching extraction.
- Key workflow: "组建评审专家组" (form review expert panel) — extract panel leader (组长) and members (组员) from candidate pool.

## Brand personality & voice

- Professional, administrative tone suited for government/engineering compliance context.
- UI labels and messages in Chinese (Simplified).

## Visual design & UX direction

- Vite + React + Tailwind CSS + Lucide React icons; `@/` path alias maps to `src/`.
- Production-grade, non-cookie-cutter UI per global instructions (see `.bolt/prompt`).
- SelectionPage uses sections for leader and member extraction, each showing:
  - Eligible candidate count ("符合X条件的专家：Y人") before extraction.
  - "预览符合条件人员" button → modal listing all eligible experts (name, work unit, title, phone, qualification category + 组长/组员 identity).
- Preview modal uses Lucide `X` icon for close button.
- Qualification fields referenced: 公路工程桥梁隧道工程专项, 公路工程乙级, 公路工程丙级, 水运工程材料乙级, 水运工程材料丙级, 水运工程结构乙级.
- Matching rules: leader candidates must have "组长" in relevant qualification field; member candidates must have "组长" or "组员".
- 3x pool logic and conflict avoidance applied during extraction.

## Decisions, constraints & rationale

- Extraction eligibility is pre-computed (counted) before user triggers extraction, improving transparency.
- Preview modal shows full eligible list before committing to extraction.
- Only `lucide-react` for icons; no extra UI/icon packages unless explicitly requested.
- Build/typecheck must pass before considering work complete.

## Open questions & assumptions

- Exact data model for expert qualifications (how "组长"/"组员" tags are stored against qualification fields) is inferred from usage; schema details not yet confirmed.
- 3x pool logic specifics (how the 3x multiplier and conflict avoidance interact with the eligible count display) not fully documented.