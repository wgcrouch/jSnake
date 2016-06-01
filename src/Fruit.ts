import Grid from './Grid';
import Point2D from './Point2D';
import Canvases from './Canvases';
import GameObject from './GameObject';

/**
 * Fruit object, can be eaten by a snake
 */
class Fruit implements GameObject {

    constructor(private grid: Grid, public position = new Point2D(10, 10)) {}

    move (newPoint2D) {
        this.position = newPoint2D;
    }

    update () {}

    draw (canvases: Canvases) {
        canvases.game.fillStyle = '#000000';
        this.grid.drawBlock(canvases.game, this.position);
    }

}

export default Fruit;
