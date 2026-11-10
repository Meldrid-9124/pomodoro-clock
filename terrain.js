class TerrainGrid {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");

    // Grid settings
    this.gridSize = 8; // Clean 8x8 base grid matching reference scale
    this.angle = Math.PI / 9; // ~20-degree isometric tilt angle (flatter perspective)

    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    this.drawGrid();
  }

  // Isometric projection mapping
  isoProject(x, y, z = 0) {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // Dynamic scale factor derived directly from canvas width for mobile viewports
    const scale = this.width * 0.06; // original: 0.085

    const screenX = centerX + (x - y) * Math.cos(this.angle) * scale;
    const screenY =
      centerY + (x + y) * Math.sin(this.angle) * scale - z * scale;

    return { x: screenX, y: screenY };
  }

  drawGrid() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isNight = document.body.classList.contains("night-theme");
    const gridColor = isNight
      ? "rgba(0, 242, 254, 0.4)"
      : "rgba(180, 140, 110, 0.55)";
    const labelColor = isNight
      ? "rgba(0, 242, 254, 0.85)"
      : "rgba(120, 90, 70, 0.85)";

    this.ctx.lineWidth = 1.5;

    const offset = this.gridSize / 2;

    // 1. Draw Iso Base Lines (X-Axis)
    for (let x = -offset; x <= offset; x++) {
      const p1 = this.isoProject(x, -offset, 0);
      const p2 = this.isoProject(x, offset, 0);

      this.ctx.beginPath();
      this.ctx.strokeStyle = gridColor;
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    // 2. Draw Iso Base Lines (Y-Axis)
    for (let y = -offset; y <= offset; y++) {
      const p1 = this.isoProject(-offset, y, 0);
      const p2 = this.isoProject(offset, y, 0);

      this.ctx.beginPath();
      this.ctx.strokeStyle = gridColor;
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    // 3. Draw Edge Ticks and Skewed Labels
    this.drawEdgeTicks(offset, labelColor);
  }

  drawEdgeTicks(offset, color) {
    this.ctx.fillStyle = color;
    // Bump font size and use system sans font matching reference UI
    this.ctx.font = "500 11px system-ui, -apple-system, sans-serif";

    const coordsLong = ["93° W", "91° W", "89° W", "87° W"];
    const coordsLat = ["50° N", "52° N", "54° N", "56° N"];

    let idx = 0;
    const step = 2; // Space labels across alternate grid lines

    for (let i = -offset + 1; i < offset; i += step) {
      // --- Bottom-Left Edge (Longitude) ---
      const ptLeft = this.isoProject(i, offset, 0);
      const textLong = coordsLong[idx % coordsLong.length];

      this.ctx.save();

      this.ctx.translate(ptLeft.x - 4, ptLeft.y + 12);

      // True Isometric Matrix Transformation (Skew + Rotate + Scale)
      // [a, b, c, d, e, f] -> Applies shear along the isometric plane
      const cosA = Math.cos(-this.angle);
      const sinA = Math.sin(-this.angle);
      this.ctx.transform(cosA, sinA, 0, 0.85, 0, 0);

      this.ctx.textAlign = "right";
      this.ctx.fillText(textLong, 0, 0);
      this.ctx.restore();

      // --- Bottom-Right Edge (Latitude) ---
      const ptRight = this.isoProject(offset, i, 0);
      const textLat = coordsLat[idx % coordsLat.length];

      this.ctx.save();
      this.ctx.translate(ptRight.x + 4, ptRight.y + 12);

      // Opposite Isometric Matrix Shear Transformation
      const cosB = Math.cos(this.angle);
      const sinB = Math.sin(this.angle);
      const skewY = Math.sin(this.angle);
      const scaleY = Math.sin(this.angle);

      this.ctx.transform(1, 0.5, 0, 1, 0, 0);

      this.ctx.textAlign = "left";
      this.ctx.fillText(textLat, 0, 0);
      this.ctx.restore();

      idx++;
    }
  }

  drawMountain(progress = 0.5) {
    const resolution = 30; // Grid sampling resolution
    const bounds = this.gridSize / 2;
    const step = (bounds * 2) / resolution;

    // Generate 2D Height Grid Array
    const heightGrid = [];
    for (let i = 0; i <= resolution; i++) {
      heightGrid[i] = [];
      const x = -bounds + i * step;
      for (let j = 0; j <= resolution; j++) {
        const y = -bounds + j * step;
        heightGrid[i][j] = getElevation(x, y, progress);
      }
    }

    // Draw 14 stacked contour levels
    const numLevels = 14;
    const maxZ = 40 * progress;

    for (let level = 1; level <= numLevels; level++) {
      const targetZ = (level / numLevels) * maxZ;
      if (targetZ <= 0) continue;

      // Set elevation contour stroke color (Desert Terra Cotta to Amber gradient)
      const isNight = document.body.classList.contains("night-theme");
      const levelRatio = level / numLevels;

      this.ctx.beginPath();
      this.ctx.lineWidth = 1.2;
      this.ctx.strokeStyle = isNight
        ? `rgba(0, ${Math.floor(180 + levelRatio * 75)}, 254, 0.85)`
        : `rgba(${Math.floor(140 + levelRatio * 90)}, ${Math.floor(60 + levelRatio * 40)}, 30, 0.85)`;

      // Marching squares segment trace
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const x1 = -bounds + i * step;
          const x2 = x1 + step;
          const y1 = -bounds + j * step;
          const y2 = y1 + step;

          const z00 = heightGrid[i][j];
          const z10 = heightGrid[i + 1][j];
          const z01 = heightGrid[i][j + 1];
          const z11 = heightGrid[i + 1][j + 1];

          // Trace line segments where terrain intersects current slice level
          this.traceContourCell(x1, y1, x2, y2, z00, z10, z01, z11, targetZ);
        }
      }
      this.ctx.stroke();
    }
  }

  // Linear interpolation cell tracer
  traceContourCell(x1, y1, x2, y2, z00, z10, z01, z11, targetZ) {
    // Interpolate points crossing targetZ threshold
    const points = [];

    if (z00 >= targetZ !== z10 >= targetZ) {
      const t = (targetZ - z00) / (z10 - z00);
      points.push(this.isoProject(x1 + t * (x2 - x1), y1, targetZ));
    }
    if (z10 >= targetZ !== z11 >= targetZ) {
      const t = (targetZ - z10) / (z11 - z10);
      points.push(this.isoProject(x2, y1 + t * (y2 - y1), targetZ));
    }
    if (z01 >= targetZ !== z11 >= targetZ) {
      const t = (targetZ - z01) / (z11 - z01);
      points.push(this.isoProject(x1 + t * (x2 - x1), y2, targetZ));
    }
    if (z00 >= targetZ !== z01 >= targetZ) {
      const t = (targetZ - z00) / (z01 - z00);
      points.push(this.isoProject(x1, y1 + t * (y2 - y1), targetZ));
    }

    if (points.length === 2) {
      this.ctx.moveTo(points[0].x, points[0].y);
      this.ctx.lineTo(points[1].x, points[1].y);
    }
  }
}

// Simple Perlin/Simplex Noise Generator
// the reason this is used here is so that we get connected points
// however, fractal detail is not used here
// this will generate smooth mountain like structures
// Compact pseudo-noise generator for 3D terrain elevation
function getElevation(x, y, progress) {
  // Center distance falloff so mountain forms in center of grid
  const distFromCenter = Math.sqrt(x * x + y * y);
  const maxRadius = 4.5;
  const edgeFalloff = Math.max(0, 1 - distFromCenter / maxRadius);

  // Multi-frequency wave superposition (simulates natural mountain peaks)
  let noise = Math.sin(x * 0.8) * Math.cos(y * 0.8) * 1.5;
  noise += Math.sin(x * 1.5 + y * 1.2) * 0.8;
  noise += Math.cos(x * 0.4 - y * 0.6) * 2.0;

  // Normalize noise to positive height scale
  const baseHeight = (noise + 3.0) * edgeFalloff;

  // Scale total mountain height smoothly with Pomodoro progress ratio (0.0 -> 1.0)
  return baseHeight * progress * 40; // Max elevation height in Z units
}

// Instantiate on load
document.addEventListener("DOMContentLoaded", () => {
  window.terrainInstance = new TerrainGrid("terrain-canvas");
});
