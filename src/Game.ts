import Grid from './Grid';
import EventBus from './EventBus';
import GameOverScreen from './GameOverScreen';
import Fruit from './Fruit';
import Snake from './Snake';
import FruitChecker from './FruitChecker';
import Canvases from './Canvases';
import GameObject from './GameObject';

/**
 * Object to control the game. Runs the game loop and manages all the objects
 */
class Game {

    private objects: GameObject[];
    private time = 0;
    private requestId: number;
    private canvases: Canvases;
    private score = 0;
    private fruitScore = 20;
    private running = false;
    private grid: Grid;
    private snake: Snake;
    private fruit: Fruit;

    constructor (gameId, backId, uiId, width, height) {
        this.grid = new Grid(width, height, 10, 10, 2);

        this.canvases = new Canvases(gameId, backId, uiId, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
    }

    stop () {
        this.running = false;
        this.objects = [];
    }

    close () {
        return null;
    }

    clear () {
        this.canvases.game.clearRect(0, 0, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
        this.canvases.ui.clearRect(0, 0, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
    }

    handleEvents() {

        const menuOptions = {
            'YES': this.start,
            'NO': this.close
        };

        let event = EventBus.pop();

        while (event) {
            switch (event.name) {
                case 'controller.direction':
                    this.snake.changeDir(event.value);
                    break;
                case 'controller.menu':
                    if (!this.running && menuOptions[event.value]) {
                        menuOptions[event.value].call(this);
                    }
                    break;
                case 'snake.hitSelf':
                    this.gameOver();
                    break;
                case 'snake.eatFruit':
                    this.fruit.move(this.grid.randomPoint2D(this.snake.getPositions()));
                    this.snake.grow();
                    this.score += this.fruitScore * this.snake.speed;
                    break;
            }
            event = EventBus.pop();
        }
    }

    /**
     * Called on each frame to advance the game state
     */
    step (delta) {
        this.handleEvents();
        this.objects.forEach((object) => object.update(delta));
        this.clear();
        this.objects.forEach((object) => object.draw(this.canvases));
    }

    /**
     * Main game loop. Pass through time since last frame so we can do interpolation
     */
    gameLoop () {
        this.requestId = window.requestAnimationFrame(this.gameLoop.bind(this));
        const now = new Date().getTime();
        const delta = now - this.time;
        this.step(delta);
        this.time = now;
    }

    /**
     * Stop the game and show the game over screen
     */
    gameOver () {
        this.stop();
        this.objects.push(new GameOverScreen(this.score));
    }

    /**
     * Start the game resetting all the game elements and starting up the game loop
     */
    start () {
        this.running = true;
        this.time = 0;
        this.score = 0;
        this.fruit = new Fruit(this.grid);
        this.snake = new Snake(this.grid);
        this.objects = [this.fruit, this.snake, new FruitChecker(this.snake, this.fruit, this.grid)];
        this.gameLoop();
    }
}

export default Game;
