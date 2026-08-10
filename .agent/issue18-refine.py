from pathlib import Path

path = Path("src/mock/weather.ts")
text = path.read_text()

replacements = [
    (
        """  ['storm', 114.112, 22.538, 29.8],
  ['severeStorm', 114.128, 22.559, 43.4],
  ['storm', 114.203, 22.536, 26.7],
  ['storm', 114.349, 22.637, 28.5],
  ['severeStorm', 114.364, 22.662, 42.1],
  ['storm', 114.445, 22.645, 27.6],""",
        """  ['storm', 114.118, 22.546, 28.9],
  ['severeStorm', 114.132, 22.558, 44.2],
  ['storm', 114.207, 22.541, 25.9],
  ['storm', 114.357, 22.649, 27.4],
  ['severeStorm', 114.369, 22.662, 43.1],
  ['storm', 114.446, 22.652, 25.8],""",
    ),
    (
        """const stormCorePath: Coordinate[] = [
  [114.108, 22.536],
  [114.126, 22.558],
  [114.142, 22.545],
  [114.198, 22.539],
  [114.214, 22.555],
];""",
        """const stormCorePath: Coordinate[] = [
  [114.116, 22.547],
  [114.133, 22.559],
  [114.202, 22.541],
  [114.215, 22.552],
];""",
    ),
    (
        """  ...createBandCells('heavy', 18.8, [[114.205, 22.495], [114.318, 22.58], [114.374, 22.642], [114.487, 22.662]], coreOffsets),
  ...createBandCells('storm', 27.6, [[114.126, 22.549], [114.207, 22.543]], coreOffsets),
  ...createBandCells('severeStorm', 39.2, [[114.128, 22.557], [114.209, 22.545]], coreOffsets),
  ...createBandCells('severeStorm', 37.8, [[114.361, 22.653], [114.449, 22.653]], coreOffsets),""",
        """  ...createBandCells('heavy', 18.8, [[114.205, 22.495], [114.318, 22.58], [114.374, 22.642], [114.487, 22.662]], coreOffsets),
  ...createBandCells('storm', 27.6, [[114.129, 22.552], [114.207, 22.542]], coreOffsets),
  ...createBandCells('severeStorm', 39.2, [[114.133, 22.559], [114.205, 22.541]], coreOffsets),
  ...createBandCells('severeStorm', 38.6, [[114.368, 22.661]], coreOffsets),
  ...createBandCells('storm', 29.4, [[114.445, 22.651]], coreOffsets),""",
    ),
    (
        """const luohuCoreCenters: Coordinate[] = [
  [114.112, 22.538],
  [114.128, 22.559],
  [114.141, 22.547],
  [114.201, 22.537],
  [114.216, 22.555],
];""",
        """const luohuCoreCenters: Coordinate[] = [
  [114.118, 22.547],
  [114.133, 22.559],
  [114.207, 22.542],
];""",
    ),
    (
        """const pingshanCoreCenters: Coordinate[] = [
  [114.347, 22.637],
  [114.363, 22.662],
  [114.377, 22.648],
  [114.442, 22.644],
  [114.458, 22.671],
];""",
        """const pingshanCoreCenters: Coordinate[] = [
  [114.357, 22.649],
  [114.369, 22.662],
  [114.446, 22.652],
];""",
    ),
    (
        """const easternBurstCenters: Coordinate[] = [
  [114.348, 22.635],
  [114.365, 22.659],
  [114.444, 22.643],
  [114.459, 22.671],
];""",
        """const easternBurstCenters: Coordinate[] = [
  [114.356, 22.647],
  [114.371, 22.663],
  [114.446, 22.651],
];""",
    ),
    (
        """  ...createFragmentCells('severeStorm', 39.4, [[114.125, 22.557], [114.204, 22.544], [114.218, 22.532]], 0.008),""",
        """  ...createFragmentCells('severeStorm', 39.4, [[114.132, 22.559], [114.205, 22.542]], 0.008),""",
    ),
    (
        """        [114.121, 22.552],
        [114.205, 22.543],
        [114.219, 22.532],
        [114.357, 22.649],""",
        """        [114.132, 22.559],
        [114.205, 22.542],
        [114.368, 22.661],""",
    ),
]

changed = 0
for old, new in replacements:
    if old in text:
        text = text.replace(old, new, 1)
        changed += 1
    elif new not in text:
        raise SystemExit(f"Expected old or refined geometry block not found:\n{old}")

if changed:
    path.write_text(text)
    print(f"Applied {changed} geometry replacements")
else:
    print("Refined geometry already present; nothing to change")
