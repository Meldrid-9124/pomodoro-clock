class TerrainGrid {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Grid settings optimized for mobile DPR
        this.gridSize = 12; // 12x12 grid points
        this.angle = Math.PI / 6; // 30-degree isometric tilt angle

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        // Handle High-DPI (Retina) mobile screens for razor-sharp lines
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.parentElement.getBoundingClientRect();

        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);

        this.drawGrid();
    }

    // Convert 3D grid coordinate (x, y, z) into 2D screen space (px, py)
    isoProject(x, y, z = 0) {
        const centerX = this.width / 2;
        const centerY = this.height / 2 + 20; // Slight downward offset for mobile HUD
        const scale = Math.min(this.width, this.height) * 0.049; // Responsive scale factor

        // Isometric projection transformation matrix
        const screenX = centerX + (x - y) * Math.cos(this.angle) * scale;
        const screenY = centerY + (x + y) * Math.sin(this.angle) * scale - z * scale;

        return { x: screenX, y: screenY };
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Read theme state from document body
        const isNight = document.body.classList.contains('night-theme');
        const gridColor = isNight ? 'rgba(0, 242, 254, 0.25)' : 'rgba(180, 130, 90, 0.35)';
        const tickColor = isNight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(100, 80, 60, 0.5)';

        this.ctx.lineWidth = 1;

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

        // 3. Draw Edge Tick Marks (Latitude/Longitude Detail)
        this.drawEdgeTicks(offset, tickColor);
    }

    drawEdgeTicks(offset, color) {
        this.ctx.fillStyle = color;
        this.ctx.font = '500 9px monospace';

        // Array of mock latitude/longitude coordinates to display
        const coordsLat = ['93° W', '92° W', '91° W', '90° W', '89° W', '88° W', '87° W'];
        const coordsLong = ['50° N', '51° N', '52° N', '53° N', '54° N', '55° N', '56° N'];

        let labelIdx = 0;

        for (let i = -offset; i <= offset; i += 2) {
            // 1. Bottom-Left edge labels (Longitude ticks)
            const ptLeft = this.isoProject(i, offset, 0);
            const textLong = coordsLong[labelIdx % coordsLong.length];
            this.ctx.save();
            this.ctx.translate(ptLeft.x - 8, ptLeft.y + 12);
            // Rotate text to match isometric projection angle
            this.ctx.rotate(-this.angle / 1.5);
            this.ctx.textAlign = 'right';
            this.ctx.fillText(textLong, 0, 0);
            this.ctx.restore();

            // 2. Bottom-Right edge labels (Latitude ticks)
            const ptRight = this.isoProject(offset, i, 0);
            const textLat = coordsLat[labelIdx % coordsLat.length];

            this.ctx.save();
            this.ctx.translate(ptRight.x + 8, ptRight.y + 12);
            // Rotate text along the opposite isometric angle
            this.ctx.rotate(this.angle / 1.5);
            this.ctx.textAlign = 'left';
            this.ctx.fillText(textLat, 0, 0);
            this.ctx.restore();

            labelIdx++;
        }
    }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
    window.terrainInstance = new TerrainGrid('terrain-canvas');
});