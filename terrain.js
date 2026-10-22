class TerrainGrid {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Grid settings
        this.gridSize = 8; // Clean 8x8 base grid matching reference scale
        this.angle = Math.PI / 9; // ~20-degree isometric tilt angle (flatter perspective)

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
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
        const scale = this.width * 0.060; // original: 0.085 

        const screenX = centerX + (x - y) * Math.cos(this.angle) * scale;
        const screenY = centerY + (x + y) * Math.sin(this.angle) * scale - z * scale;

        return { x: screenX, y: screenY };
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const isNight = document.body.classList.contains('night-theme');
        const gridColor = isNight ? 'rgba(0, 242, 254, 0.4)' : 'rgba(180, 140, 110, 0.55)';
        const labelColor = isNight ? 'rgba(0, 242, 254, 0.85)' : 'rgba(120, 90, 70, 0.85)';

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
        this.ctx.font = '500 11px system-ui, -apple-system, sans-serif';

        const coordsLong = ['93° W', '91° W', '89° W', '87° W'];
        const coordsLat = ['50° N', '52° N', '54° N', '56° N'];

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
            
            this.ctx.textAlign = 'right';
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
            
            this.ctx.textAlign = 'left';
            this.ctx.fillText(textLat, 0, 0);
            this.ctx.restore();

            idx++;
        }
    }
}

// Instantiate on load
document.addEventListener('DOMContentLoaded', () => {
    window.terrainInstance = new TerrainGrid('terrain-canvas');
});