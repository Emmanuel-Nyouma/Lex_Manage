# 🎨 LexManage Design System

## 1. Comprehensive Component Library

| Component | Variants | Sizes | Notes |
|-----------|----------|-------|-------|
| **Button** | primary, secondary, ghost, destructive | sm, md, lg | |
| **Badge** | success, warning, error, info | xs, sm, md | |
| **Card** | light, dark | elevations: sm, md, lg | |
| **Input** | default, error, success | sm, md, lg | |
| **Modal** | - | sm, md, lg | animations: fade, zoom |

## 2. Color Contrast Matrix (WCAG Compliance)

Ensure all text meets WCAG AA (4.5:1) or AAA (7:1).

| Background | Light Text | Dark Text | Contrast |
|------------|------------|-----------|----------|
| slate-900 | white | slate-50 | 18:1 |
| slate-800 | white | slate-100 | 15:1 |
| slate-700 | white | slate-200 | 12:1 |
| slate-600 | white | slate-300 | 8:1 (AAA) |
| slate-500 | white | slate-400 | 5:1 (AA) |

> ⚠️ **Note:** Do not use `slate-500` for body text. Use `slate-600` or darker.

## 3. Accessibility Checklist

- [ ] All buttons have `aria-labels`
- [ ] All form inputs have associated labels
- [ ] Modals have `role="dialog"`
- [ ] Focus indicators visible (`:focus-visible`)
- [ ] Color not the only indicator (use icons/text)
- [ ] Keyboard navigation complete
- [ ] Mobile touch targets ≥ 44x44px
- [ ] Error messages associated with inputs (`aria-describedby`)
- [ ] Loading states announced (`aria-live="polite"`)
