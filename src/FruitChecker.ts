import EventBus from './EventBus';
import Snake from './Snake';
import Fruit from './Fruit';
import Grid from './Grid';
import GameObject from './GameObject';

class FruitChecker implements GameObject {

    constructor (private snake: Snake, private fruit: Fruit, private grid: Grid) {}

    draw () {}

    update () {
        if (this.grid.compareCoordinates(this.snake.currentPosition(), this.fruit.position)) {
            EventBus.trigger('snake.eatFruit', true);
        }
    }
}

export default FruitChecker;
