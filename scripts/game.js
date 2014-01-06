window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

(function ($) {
    'use strict';
    var EventManager = _.extend({}, Backbone.Events),
        ControllerKeyboard,
        Snake,
        Game,
        Fruit;

    /**
     * Keyboard controller, fires events so its easy to swap out for something different
     */
    ControllerKeyboard = {
        init: function (element) {
            $(element).keydown(function (evt) {
                var dirs = {37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN'};
                if (dirs[evt.keyCode]) {
                    evt.preventDefault();
                    EventManager.trigger('controller.direction', dirs[evt.keyCode]);
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

    function compareCoordinates(coord1, coord2) {
        return coord1[0] === coord2[0] && coord1[1] === coord2[1];
    }



    /**
     * Our snake object, maintains its positions and can draw itself
     */
    Snake = function () {
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
            }, opposites = {
                UP: directions.DOWN, 
                DOWN: directions.UP,
                LEFT: directions.RIGHT,
                RIGHT: directions.LEFT
            };


        function tail() {
            return _.rest(positions);
        }

        function grow() {
            length += 2;
            if (speed < maxSpeed) {
                speed += 1;
            }
        }

        function currentPosition() {
            return positions[0];
        }

        function getPositions() {
            return positions;
        }

        function nextPosition() {
            var pos = currentPosition();
            return [pos[0] + dir[0], pos[1] + dir[1]];
        }

        function getFrameStep() {
            return 1000 / speed;
        }

        function update(delta) {
            elapsedTime += delta;
            if (elapsedTime >= getFrameStep() && (dir[0] || dir[1])) {
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


        function changeDir(direction) {
            dir = (dir != opposites[direction]) ? directions[direction] : dir;            
        }

        function stop() {
            EventManager.off('controller.direction', changeDir);
            dir = [0,0];
        }

        EventManager.on('controller.direction', changeDir);

        return {
            draw: draw,
            update: update,
            position: currentPosition,
            positions: getPositions,
            tail: tail,
            grow: grow,
            stop: stop
        };
    };

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
            objects,
            time = 0,
            requestId = null,
            canvases = {},
            gridBounds = [width, height],
            fps = 60,
            canvasBounds;

        canvasBounds = grid2coord([gridBounds[0] + 1, gridBounds[1] + 1]);

        _.forEach(canvasIds, function (id, name) {
            var canvas = document.getElementById(id).getContext('2d');
            canvas.canvas.width = canvasBounds[0];
            canvas.canvas.height = canvasBounds[1];
            canvases[name] = canvas;
        });


        function getInterval() {
            return 1000 / fps;
        }

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

        /**
         * Stop the game and show the game over screen
         */
        function gameOver() {
            snake.stop();
            window.setTimeout(stop, 2000);
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

            //Snake hit wall
            if (x < 0 || x > gridBounds[0] || y < 0 || y > gridBounds[1]) {
                gameOver();
            }

            //Snake hit fruit
            if (compareCoordinates(snakePosition, fruit.position())) {
                fruit.move(randomPosition(snake.positions()));
                snake.grow();
                if (fps < 60) {
                    fps += 1;
                }
            }
        }

        function clear() {
            canvases.game.clearRect(0, 0, canvasBounds[0], canvasBounds[1]);

        }

        /**
         * Called on each frame to advance the game state
         */
        function step(delta) {
            clear();
            checkRules();
            _.forEach(objects, function (object) {
                object.draw(canvases);
            });
            _.forEach(objects, function (object) {
                object.update(delta);
            });
        }

        /**
         * Main game loop. Tries to maintain an consistent framerate
         */
        function gameLoop() {
            requestId = window.requestAnimationFrame(gameLoop);
            var delta, now = new Date().getTime(), interval = getInterval();
            delta = now - time;
            step(delta);
            time = now;
        }

        function start() {
            time = 0;
            fruit = new Fruit(gridBounds);
            snake = new Snake();
            objects = [fruit, snake];
            gameLoop();
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