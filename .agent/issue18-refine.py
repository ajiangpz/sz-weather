from pathlib import Path

path = Path("src/mock/weather.ts")
text = path.read_text()

replacements = [
    (
        """  ['storm', 114.112, 22.512, 29.8],
  ['severeStorm', 114.163, 22.565, 43.4],
  ['storm', 114.232, 22.533, 26.7],
  ['storm', 114.333, 22.612, 28.5],
  ['severeStorm', 114.389, 22.681, 42.1],
  ['storm', 114.468, 22.638, 27.6],""",
        """  ['storm', 114.112, 22.538, 29.8],
  ['severeStorm', 114.128, 22.559, 43.4],
  ['storm', 114.203, 22.536, 26.7],
  ['storm', 114.349, 22.637, 28.5],
  ['severeStorm', 114.364, 22.662, 42.1],
  ['storm', 114.445, 22.645, 27.6],""",
    ),
    (
        """const stormCorePath: Coordinate[] = [
  [114.108, 22.532],
  [114.128, 22.558],
  [114.198, 22.552],
  [114.222, 22.532],
];""",
        """const stormCorePath: Coordinate[] = [
  [114.108, 22.536],
  [114.126, 22.558],
  [114.142, 22.545],
  [114.198, 22.539],
  [114.214, 22.555],
];""",
    ),
    (
        """  ...createBandCells('heavy', 18.8, [[114.205, 22.495], [114.318, 22.58], [114.374, 22.642], [114.487, 22.662]], coreOffsets),
  ...createBandCells('storm', 27.6, [[114.112, 22.54], [114.202, 22.55]], coreOffsets),
  ...createBandCells('severeStorm', 39.2, [[114.129, 22.552], [114.199, 22.557]], coreOffsets),
  ...createBandCells('severeStorm', 37.8, [[114.356, 22.646], [114.447, 22.651]], coreOffsets),""",
        """  ...createBandCells('heavy', 18.8, [[114.205, 22.495], [114.318, 22.58], [114.374, 22.642], [114.487, 22.662]], coreOffsets),
  ...createBandCells('storm', 27.6, [[114.126, 22.549], [114.207, 22.543]], coreOffsets),
  ...createBandCells('severeStorm', 39.2, [[114.128, 22.557], [114.209, 22.545]], coreOffsets),
  ...createBandCells('severeStorm', 37.8, [[114.361, 22.653], [114.449, 22.653]], coreOffsets),""",
    ),
    (
        """const luohuCoreCenters: Coordinate[] = [
  [114.104, 22.528],
  [114.129, 22.558],
  [114.198, 22.553],
  [114.225, 22.528],
];""",
        """const luohuCoreCenters: Coordinate[] = [
  [114.112, 22.538],
  [114.128, 22.559],
  [114.141, 22.547],
  [114.201, 22.537],
  [114.216, 22.555],
];""",
    ),
    (
        """const pingshanCoreCenters: Coordinate[] = [
  [114.342, 22.628],
  [114.365, 22.662],
  [114.438, 22.646],
  [114.463, 22.674],
];""",
        """const pingshanCoreCenters: Coordinate[] = [
  [114.347, 22.637],
  [114.363, 22.662],
  [114.377, 22.648],
  [114.442, 22.644],
  [114.458, 22.671],
];""",
    ),
    (
        """const easternBurstCenters: Coordinate[] = [
  [114.336, 22.621],
  [114.363, 22.658],
  [114.441, 22.644],
  [114.468, 22.678],
];""",
        """const easternBurstCenters: Coordinate[] = [
  [114.348, 22.635],
  [114.365, 22.659],
  [114.444, 22.643],
  [114.459, 22.671],
];""",
    ),
    (
        """  ...createFragmentCells('severeStorm', 39.4, [[114.124, 22.551], [114.198, 22.554], [114.219, 22.529]], 0.008),""",
        """  ...createFragmentCells('severeStorm', 39.4, [[114.125, 22.557], [114.204, 22.544], [114.218, 22.532]], 0.008),""",
    ),
    (
        """        [114.119, 22.545],
        [114.207, 22.552],
        [114.227, 22.527],
        [114.349, 22.638],""",
        """        [114.121, 22.552],
        [114.205, 22.543],
        [114.219, 22.532],
        [114.357, 22.649],""",
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
