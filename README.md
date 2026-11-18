# fan fiction
### books on the world wide web
### https://fan-fiction.xyz/

## Shared emoji cursor

Tiny Bag Magazine issues 1 and 2 load `scripts/emoji-cursor.js`. To use the same
cursor on another magazine one directory below the site root, add this to its
HTML head:

```html
<script type="module" src="../scripts/emoji-cursor.js"></script>
```

Adjust the relative path for deeper pages. The file owns the emoji palette,
size, and animation. Pointer movement and touch gestures create a temporary
trail; it stays enabled independently of a magazine's reduced-motion controls.
Input is used only to draw the trail in the browser and is not recorded or sent
anywhere. Pages without canvas support render without the decoration.

Run its behavior checks with `node --test tests/emoji-cursor.test.cjs`, then
visually check both magazines, including scrolling and motion controls.
