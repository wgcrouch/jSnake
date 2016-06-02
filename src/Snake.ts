import FixedQueue from './FixedQueue';
import Grid from './Grid';
import EventBus from '././EventBus';
import Canvases from './Canvases';
import GameObject from './GameObject';
import Point2D from './Point2D';

const DIRECTIONS = {
  UP: new Point2D(0, -1),
  DOWN: new Point2D(0, 1),
  LEFT: new Point2D(-1, 0),
  RIGHT: new Point2D(1, 0)
};

const OPPOSITES = {
  UP: DIRECTIONS.DOWN,
  DOWN: DIRECTIONS.UP,
  LEFT: DIRECTIONS.RIGHT,
  RIGHT: DIRECTIONS.LEFT
};

/**
 * Snake object, maintains its positions and can draw itself
 */
class Snake implements GameObject {

    public speed = 10;
    private positions = new FixedQueue(3, [ new Point2D(2, 2) ]);
    private dir = DIRECTIONS.RIGHT;
    private maxSpeed = 100;
    private elapsedTime = 0;
    private actionQueue = new FixedQueue<Point2D>(4);

    constructor (private grid: Grid) {}

    tail () {
        return this.getPositions().slice(1);
    }

    nextPosition () {
        const pos = this.currentPosition();
        let next: Point2D;

        if ((this.dir === DIRECTIONS.RIGHT && pos.x === this.grid.width) ||
            (this.dir === DIRECTIONS.LEFT && pos.x === 0)) {
            next = new Point2D(this.grid.width - pos.x, pos.y);
        } else if ((this.dir === DIRECTIONS.DOWN && pos.y === this.grid.height) ||
                   (this.dir === DIRECTIONS.UP && pos.y === 0)) {
            next = new Point2D(pos.x, this.grid.height - pos.y);
        } else {
            next = new Point2D(pos.x + this.dir.x, pos.y + this.dir.y);
        }
        return next;
    }

    getFrameTime () {
        return 1000 / (this.speed / 2);
    }

    grow () {
        this.positions.grow(2);
        if (this.speed < this.maxSpeed) {
            this.speed += 1;
        }
    }

    getPositions() {
        return this.positions.items;
    }

    currentPosition () {
        return this.getPositions()[0];
    }

    changeDir(direction: Point2D) {
        this.actionQueue.add(direction);
    }

    /**
     * Move the snake in the direction it is travelling. Snake speed is based on time elapsed
     */
    update (delta: number) {
        this.elapsedTime += delta;
        if (this.elapsedTime >= this.getFrameTime() && (this.dir.x || this.dir.y)) {
            const newDir: any = this.actionQueue.pop();
            if (newDir) {
                this.dir = (this.dir !== OPPOSITES[newDir]) ? DIRECTIONS[newDir] : this.dir;
            }
            this.positions.add(this.nextPosition());

            const compare = (pos: Point2D) => this.grid.compareCoordinates(this.currentPosition(), pos);
            if (this.tail().some(compare)) {
                EventBus.trigger('snake.hitSelf', true);
            }

            this.elapsedTime = 0;
        }
    }

    draw(canvases: Canvases) {
        canvases.game.fillStyle = '#f10087';

        this.getPositions().forEach((position) => {
            this.grid.drawBlock(canvases.game, position);
        });

    }
}

export default Snake;
