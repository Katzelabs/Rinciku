## Rinciku design system — how to build with it

These are real **shadcn/ui** components (Radix primitives, `radix-rhea` style, **olive** base color) styled with **Tailwind v4**. Every component is a named export on the `Rinciku` namespace. Compound components export their parts under the same namespace — import the parts you compose.

### Setup & wrapping

- **No global provider is required** for most components. Import and render directly.
- **Tooltip**: wrap the app (or the tooltip subtree) once in `TooltipProvider`. `Tooltip`, `TooltipTrigger`, `TooltipContent` go inside it.
- **Toasts**: render `<Toaster />` once near the app root (it's the `sonner` toaster); call `toast()` from `sonner` to fire toasts.
- **Sidebar**: the `Sidebar*` family must be wrapped in `SidebarProvider`.
- **Dark mode**: add the class `dark` to a root ancestor (e.g. `<html class="dark">`). All token values flip automatically.
- The brand font **Figtree Variable** ships with the bundle and is applied via `--font-sans`; you don't need to load it.

### Styling idiom — semantic Tailwind utilities

Style with Tailwind utility classes built on the design system's **semantic color tokens** — never raw hex or palette colors like `bg-olive-600`. Each token has `bg-*`, `text-*`, and `border-*` variants:

| Token | Use |
|---|---|
| `background` / `foreground` | page surface + default text |
| `card` / `card-foreground` | card surfaces |
| `popover` / `popover-foreground` | overlays, menus |
| `primary` / `primary-foreground` | primary actions, emphasis |
| `secondary` / `secondary-foreground` | secondary actions |
| `muted` / `muted-foreground` | subdued surfaces + secondary text |
| `accent` / `accent-foreground` | hover/active surfaces |
| `destructive` | errors, destructive actions |
| `border` / `input` / `ring` | borders, input borders, focus rings |
| `sidebar`, `sidebar-accent`, `sidebar-primary`, `sidebar-border`, … | sidebar surfaces |

So: `className="bg-card text-card-foreground border border-border"`, `className="text-muted-foreground"`, `className="bg-primary text-primary-foreground"`. Corner radius follows the `--radius` scale via `rounded-md` / `rounded-lg` / `rounded-xl`. Prefer composing the library components and their variant props (e.g. `<Button variant="destructive" size="sm">`) over hand-styling; use the utilities above for your own layout glue.

### Where the truth lives

- **`styles.css`** (and its `@import` closure, incl. `_ds_bundle.css`) defines every token and the compiled utility classes — read it before inventing classes.
- Each component ships **`<Name>.d.ts`** (its prop contract) and **`<Name>.prompt.md`** (usage) — read these for the exact API and variants.

### One idiomatic example

```tsx
<TooltipProvider>
  <Card className="max-w-sm">
    <CardHeader>
      <CardTitle>Monthly budget</CardTitle>
      <CardDescription className="text-muted-foreground">June 2026</CardDescription>
    </CardHeader>
    <CardContent className="flex items-center justify-between">
      <span className="text-2xl font-semibold">Rp 4.200.000</span>
      <Badge variant="secondary">On track</Badge>
    </CardContent>
    <CardFooter className="gap-2">
      <Button size="sm">Add expense</Button>
      <Button size="sm" variant="outline">Details</Button>
    </CardFooter>
  </Card>
</TooltipProvider>
```
