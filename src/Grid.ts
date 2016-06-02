import Point2D from './Point2D';

/**
 * The game grid, and useful functions associated with it
 */
class Grid {
    canvasBounds: Point2D;

    constructor (public width: number, public height: number,
                 private blockWidth: number, private blockHeight: number, private gap: number) {
        this.canvasBounds = this.canvasCoordinates(new Point2D(this.width + 1, this.height + 1));
    }

    /**
     * Convert coordinates on the game grid to canvas coordinates
     */
    canvasCoordinates (position: Point2D) {
        let { x, y } = position;

        x = this.gap + x * (this.blockWidth + this.gap);
        y = this.gap + y * (this.blockHeight + this.gap);

        return new Point2D(x, y);
    }

    drawBlock(canvas: CanvasRenderingContext2D, position: Point2D) {
        const coordinates = this.canvasCoordinates(position);
        canvas.fillRect(coordinates.x, coordinates.y, this.blockWidth, this.blockHeight);
    }

    /**
     * Helper function to compare coordinates, useful for filter etc.
     */
    compareCoordinates(coordinate1: Point2D, coordinate2: Point2D) {
        return coordinate1.x === coordinate2.x && coordinate1.y === coordinate2.y;
    }

    /**
     * Get a random position that is not one of takenPoint2Ds
     */
    randomPoint2D(takenPoint2Ds: Point2D[]) {

        let newPos: Point2D;

        do {
            const tempPos = new Point2D(
                Math.floor(Math.random() * (this.width + 1)),
                Math.floor(Math.random() * (this.height + 1))
            );
            const compare = (pos: Point2D) => this.compareCoordinates(tempPos, pos);
            if (!takenPoint2Ds.some(compare)) {
                newPos = tempPos;
            }
        } while (!newPos);

        return newPos;
    }
}

export default Grid;
