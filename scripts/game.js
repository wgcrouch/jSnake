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
                var dirs = {37: 'left', 38: 'up', 39: 'right', 40: 'down'};
                if (dirs[evt.keyCode]) {
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
            dx = 1,
            dy = 0,
            length = 6,
            speed = 1,
            maxSpeed = 30,
            frameCount = 0;

        function tail() {
            return _.rest(positions);
        }

        function grow() {
            length += 1;
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
            return [pos[0] + dx, pos[1] + dy];
        }

        function getFrameStep() {
            return 40 - maxSpeed - speed;
        }

        function update() {
            console.log(getFrameStep());
            if (frameCount >= getFrameStep()) {
                positions.unshift(nextPosition());
                if (positions.length > length) {
                    positions.pop();
                }
                frameCount = 0;
            } else {
                frameCount += 1;
            }

        }

        function draw(canvas) {
            canvas.fillStyle = '#f10087';
            _.forEach(positions, function (position) {
                drawRect(canvas, position);
            });
        }

        function changeDir(direction) {
            switch (direction) {
            case 'up':
                if (dy !== 1) {
                    dy = -1;
                    dx = 0;
                }
                break;
            case 'down':
                if (dy !== -1) {
                    dy = 1;
                    dx = 0;
                }
                break;
            case 'left':
                if (dx !== 1) {
                    dy = 0;
                    dx = -1;
                }
                break;
            case 'right':
                if (dx !== -1) {
                    dy = 0;
                    dx = 1;
                }
                break;
            }
        }

        EventManager.on('controller.direction', changeDir);

        return {
            draw: draw,
            update: update,
            position: currentPosition,
            positions: getPositions,
            tail: tail,
            grow: grow
        };
    };

    Fruit = function (gridBounds) {
        var pos = [10, 10];

        function position() {
            return pos;
        }

        function move(newPos) {
            pos = newPos;
        }

        function draw(canvas) {
            canvas.fillStyle = '#000000';
            drawRect(canvas, pos);
        }

        return {
            position : position,
            move: move,
            draw: draw
        };
    };

    /**
     * Object to control the game. Runs the game loop and manages all the objects
     */
    Game = function (canvasId, width, height) {

        var snake = new Snake(),
            fruit,
            time = 0,
            requestId = null,
            context,
            gridBounds = [width, height],
            fps = 60,
            canvasBounds;

        fruit = new Fruit(gridBounds);


        context = document.getElementById(canvasId).getContext('2d');
        canvasBounds = grid2coord([gridBounds[0] + 1, gridBounds[1] + 1]);
        console.log(canvasBounds);
        context.canvas.width = canvasBounds[0];
        context.canvas.height = canvasBounds[1];

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

        function checkRules() {
            var snakePosition = snake.position(),
                x,
                y;
            x = snakePosition[0];
            y = snakePosition[1];

            //Snake hit itself
            if (_.some(snake.tail(), _.partial(compareCoordinates, snake.position()))) {
                console.log("Hit Self");
            }

            //Snake hit wall
            if (x < 0 || x > gridBounds[0] || y < 0 || y > gridBounds[1]) {
                console.log("Hit Wall");
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
            context.clearRect(0, 0, canvasBounds[0], canvasBounds[1]);
        }

        /**
         * Called on each frame to advance the game state
         */
        function step() {
            clear();
            checkRules();
            fruit.draw(context);
            snake.draw(context);
            snake.update();
        }

        /**
         * Main game loop. Tries to maintain an consistent framerate
         */
        function gameLoop() {
            requestId = window.requestAnimationFrame(gameLoop);
            var delta, now = new Date().getTime(), interval = getInterval();
            delta = now - time;
            if (delta > interval) {
                time = now - (delta % interval);
                step();
            }
        }

        function start() {
            time = 0;
            gameLoop();
        }

        return {
            start: start
        };
    };

    $(document).ready(function () {
        ControllerKeyboard.init(document);

        var game = new Game('game', 27, 20);

        game.start();
    });


}(jQuery));