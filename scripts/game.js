window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

(function ($) {
    'use strict';
    var EventManager = _.extend({}, Backbone.Events),
        ControllerKeyboard,
        Snake,
        Game,
        Fruit,
        GameOverScreen,
        FixedQueue;

    /**
     * Keyboard controller, fires events so its easy to swap out for something different
     */
    ControllerKeyboard = {
        init: function (element) {
            $(element).keydown(function (evt) {
                var dirs = {37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN'},
                    menuOptions = {89: 'YES', 78: 'NO'};

                if (dirs[evt.keyCode]) {
                    evt.preventDefault();
                    EventManager.trigger('controller.direction', dirs[evt.keyCode]);
                }

                if (menuOptions[evt.keyCode]) {
                    evt.preventDefault();
                    EventManager.trigger('controller.menu', menuOptions[evt.keyCode]);
                }

            });
        }
    };

    /**
     * Convert coordinates on the game grid to canvas coordinates
     */
    function grid2coord(pos) {
        var x = pos[0],
            y = pos[1],
            width = 10,
            height = 10,
            gap = 2;

        x = gap + x * (width + gap);
        y = gap + y * (height + gap);

        return [x, y];
    }

    /**
     * Draw a rectangle given game grid coordinates
     */
    function drawRect(canvas, pos) {
        var coordPos = grid2coord(pos);

        canvas.fillRect(coordPos[0], coordPos[1], 10, 10);
    }

    /**
     * Helper function to compare coordinates, useful for filter etc.
     */
    function compareCoordinates(coord1, coord2) {
        return coord1[0] === coord2[0] && coord1[1] === coord2[1];
    }

    FixedQueue = function (length) {
        var self = this,
            items = [];

        self.add = function (item) {
            items.unshift(item);
            if (items.length > length) {
                items.pop();
            }
        };

        self.pop = function () {
            if (items.length) {
                return items.pop();
            }
            return false;
        };

        self.getItems = function () {
            return items;
        };

    };



    /**
     * Our snake object, maintains its positions and can draw itself
     */
    Snake = function (boundaries) {
        var positions = [
                [2, 1],
                [1, 1],
                [1, 2],
                [0, 2],
                [0, 1],
                [0, 0]
            ],
            dir = [1, 0],
            length = 6,
            speed = 5,
            maxSpeed = 70,
            elapsedTime = 0,
            directions = {
                UP: [0, -1],
                DOWN: [0, 1],
                LEFT: [-1, 0],
                RIGHT: [1, 0]
            },
            opposites = {
                UP: directions.DOWN,
                DOWN: directions.UP,
                LEFT: directions.RIGHT,
                RIGHT: directions.LEFT
            },
            actionQueue = new FixedQueue(4);


        function tail() {
            return _.rest(positions);
        }

        function grow() {
            length += 2;
            if (speed < maxSpeed) {
                speed += 1;
            }
        }

        function getSpeed() {
            return speed;
        }

        function currentPosition() {
            return positions[0];
        }

        function getPositions() {
            return positions;
        }

        function nextPosition() {
            var pos = currentPosition(), next;
            if ((dir === directions.RIGHT && pos[0] === boundaries[0]) || (dir === directions.LEFT && pos[0] === 0)) {
                next = [boundaries[0] - pos[0], pos[1]];
            } else if ((dir === directions.DOWN && pos[1] === boundaries[1]) || (dir === directions.UP && pos[1] === 0)) {
                next = [pos[0], boundaries[1] - pos[1]];
            } else {
                next = [pos[0] + dir[0], pos[1] + dir[1]];
            }
            return next;
        }

        function getFrameStep() {
            return 1000 / speed;
        }

        function changeDir(direction) {
            dir = (dir !== opposites[direction]) ? directions[direction] : dir;
        }

        /**
         * Move the snake in the direction it is travelling. Snake speed is based on time elapsed 
         */
        function update(delta) {
            elapsedTime += delta;
            if (elapsedTime >= getFrameStep() && (dir[0] || dir[1])) {
                var newDir = actionQueue.pop();
                if (newDir) {
                    changeDir(newDir);
                }
                positions.unshift(nextPosition());
                if (positions.length > length) {
                    positions.pop();
                }
                elapsedTime = 0;
            }
        }

        function draw(canvases) {
            canvases.game.fillStyle = '#f10087';

            _.forEach(positions, function (position) {
                drawRect(canvases.game, position);
            });

        }



        function stop() {
            EventManager.off('controller.direction', changeDir);
            dir = [0, 0];
        }

        EventManager.on('controller.direction', function (direction) {
            actionQueue.add(direction);
        });

        return {
            draw: draw,
            update: update,
            position: currentPosition,
            positions: getPositions,
            tail: tail,
            grow: grow,
            stop: stop,
            getSpeed : getSpeed
        };
    };

    /**
     * Fruit object, can be eaten by a snake
     */
    Fruit = function () {
        var pos = [10, 10];

        function position() {
            return pos;
        }

        function move(newPos) {
            pos = newPos;
        }

        function draw(canvases) {
            canvases.game.fillStyle = '#000000';
            drawRect(canvases.game, pos);
        }

        function update(delta) {
            return true;
        }

        return {
            position : position,
            move: move,
            draw: draw,
            update: update
        };
    };

    /**
     * Object to control the game. Runs the game loop and manages all the objects
     */
    Game = function (canvasIds, width, height) {

        var snake,
            fruit,
            objects  = [],
            time = 0,
            requestId = null,
            canvases = {},
            gridBounds = [width, height],
            canvasBounds,
            score = 0,
            fruitScore = 20;

        canvasBounds = grid2coord([gridBounds[0] + 1, gridBounds[1] + 1]);

        _.forEach(canvasIds, function (id, name) {
            var canvas = document.getElementById(id).getContext('2d');
            canvas.canvas.width = canvasBounds[0];
            canvas.canvas.height = canvasBounds[1];
            canvases[name] = canvas;
        });

        /**
         * Get a random position that is not one of takenPositions
         */
        function randomPosition(takenPositions) {
            var tempPos, newPos;

            do {
                tempPos = [
                    Math.floor(Math.random() * (gridBounds[0] + 1)),
                    Math.floor(Math.random() * (gridBounds[1] + 1))
                ];
                if (!_.some(takenPositions, _.partial(compareCoordinates, tempPos))) {
                    newPos = tempPos;
                }
            } while (!newPos);

            return newPos;
        }

        function stop() {
            window.cancelAnimationFrame(requestId);
        }

        function closeGame() {
            console.log("not implemented");
        }

        /**
         * Test the different game rules and take action
         */
        function checkRules() {
            var snakePosition = snake.position(),
                x,
                y;

            x = snakePosition[0];
            y = snakePosition[1];

            //Snake hit itself
            if (_.some(snake.tail(), _.partial(compareCoordinates, snake.position()))) {
                gameOver();
            }

            //Snake hit fruit
            if (compareCoordinates(snakePosition, fruit.position())) {
                fruit.move(randomPosition(snake.positions()));
                snake.grow();
                score += fruitScore * snake.getSpeed();
            }
        }

        function clear() {
            canvases.game.clearRect(0, 0, canvasBounds[0], canvasBounds[1]);
        }

        /**
         * Called on each frame to advance the game state
         */
        function step(delta) {
            checkRules();
            _.forEach(objects, function (object) {
                object.update(delta);
            });
            clear();
            _.forEach(objects, function (object) {
                object.draw(canvases);
            });
        }

        /**
         * Main game loop. Pass through time since last frame so we can do interpolation
         */
        function gameLoop() {
            requestId = window.requestAnimationFrame(gameLoop);
            var delta, now = new Date().getTime();
            delta = now - time;
            step(delta);
            time = now;
        }

        /**
         * Start the game resetting all the game elements and starting up the game loop
         */
        function start() {
            time = 0;
            score = 0;
            fruit = new Fruit(gridBounds);
            snake = new Snake(gridBounds);
            objects = [fruit, snake];
            canvases.ui.clearRect(0, 0, canvasBounds[0], canvasBounds[1]);
            gameLoop();
        }

        /**
         * Stop the game and show the game over screen
         */
        function gameOver() {
            stop();
            canvases.ui.fillStyle = '#000000';
            canvases.ui.fillRect(0, 0, canvasBounds[0], canvasBounds[1]);
            canvases.ui.fillStyle = '#FFFFFF';
            canvases.ui.textAlign = 'center';
            canvases.ui.font = 'normal 35px silkscreennormal';
            canvases.ui.fillText("Score: " + score, canvasBounds[0] / 2, canvasBounds[1] / 2 - 50);
            canvases.ui.font = 'normal 25px silkscreennormal';
            canvases.ui.fillText("Game Over", canvasBounds[0] / 2, canvasBounds[1] / 2);
            canvases.ui.font = 'normal 15px silkscreennormal';
            canvases.ui.fillText("Play Again?", canvasBounds[0] / 2, canvasBounds[1] / 2 + 45);
            canvases.ui.fillText("Y / N", canvasBounds[0] / 2, canvasBounds[1] / 2 + 65);

            EventManager.on('controller.menu', function (option) {
                var options = {
                    'YES': start,
                    'NO': closeGame
                };
                if (options[option]) {
                    options[option]();
                    EventManager.off('controller.menu');
                }
            });
        }


        return {
            start: start
        };
    };

    $(document).ready(function () {
        ControllerKeyboard.init(document);

        var game = new Game({game: 'game', back: 'background', ui: 'ui'}, 27, 20);

        game.start();
    });


}(jQuery));