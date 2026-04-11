

## Problem

The US flag image naturally centers on the flag's content, but since the stars section is on the left and stripes extend right, the visual center feels off. You want to shift the flag *image within* the round container so the flag's visual center aligns with the circle, without changing the icon's size or position.

## Solution

Use `object-position` to shift the flag image inside the clipped circle. Since `rounded-full` + `object-cover` already crops the rectangular flag into a circle, we just need to adjust which part of the flag is shown.

Specifically, change the `<img>` tag to include `object-[60%_center]` (or similar), which shifts the visible portion of the flag slightly to the right within the circle — showing more of the stripes and less of the left edge.

### Change in `src/components/chart/ChartContainer.tsx` (line ~674)

**From:**
```tsx
<img src="https://flagcdn.com/w80/us.png" alt="US" className="w-6 h-6 rounded-full object-cover border border-[#d1d4dc]/30 shadow-sm" />
```

**To:**
```tsx
<img src="https://flagcdn.com/w80/us.png" alt="US" className="w-6 h-6 rounded-full object-cover object-[60%_center] border border-[#d1d4dc]/30 shadow-sm" />
```

The `object-[60%_center]` Tailwind arbitrary value shifts the crop point rightward. We can fine-tune the percentage (55%, 65%, etc.) until it looks centered.

