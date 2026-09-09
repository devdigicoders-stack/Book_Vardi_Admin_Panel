# Workspace Theme Rule: School Cart (JSX & Tailwind CSS Design System)

You are working on the **School Cart** project. The project mandates **React JSX** and **Tailwind CSS** combined with CSS variables derived from the School Cart brand identity and stationery store mockup.

## Strict Rules to Follow:
1. **Use React JSX & Tailwind CSS**:
   - Write components using React JSX (`.jsx`).
   - Use Tailwind CSS utility classes mapped to the brand theme tokens in `src/styles/theme.css`.
2. **Brand Token Classes (No arbitrary hex values)**:
   - `bg-brand-teal`, `text-brand-teal`, `border-brand-teal`: Forest Teal (`#233835`) for dark surfaces, footer, typography accents.
   - `bg-brand-yellow`, `text-brand-yellow`, `hover:bg-brand-yellow-hover`: Primary Action Yellow (`#F5CE42`) for primary CTAs, cart badges, active tabs.
   - `bg-brand-pink`, `text-brand-pink`, `hover:bg-brand-pink-hover`: Berry Mauve (`#C45A76`) for sale badges, discount tags, active wishlist hearts.
   - `bg-brand-ochre`, `text-brand-ochre`: Warm Ochre (`#B99452`) for review rating stars and category accents.
   - `bg-brand-blue`, `text-brand-blue`: Stationery Blue (`#5B86E5`).
3. **Typography**:
   - `font-display` for headings (`Outfit`).
   - `font-sans` for body copy and general UI (`Plus Jakarta Sans`).
4. **Never Use Arbitrary Hex Codes**:
   - Avoid `bg-[#233835]` or inline `style={{ ... }}` for colors. Always use the defined theme tokens.
5. **Always Reference**:
   - Refer to `THEME_RULES.md` for complete design guidelines.
