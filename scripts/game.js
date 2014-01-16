window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

(function ($) {
    'use strict';
    var eventBus,
        controllerKeyboard,
        Snake,
        Game,
        Fruit,
        GameOverScreen,
        FixedQueue,
        FruitChecker,
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
        };


    /**
     * Even bus to handle events that may occur asyncronoulsy
     */
    eventBus = (function () {
        var events = [],
            instance = {};

        instance.trigger = function trigger(name, value) {
            events.unshift({ 'name' : name, 'value' : value});
        };

        instance.pop = function pop() {
            return events.pop();
        };

        return instance;
    }());

    /**
     * Keyboard controller, fires events so its easy to swap out for something different
     */
    controllerKeyboard = {
        init: function init(element) {
            $(element).keydown(function (evt) {
                var dirs = {37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN'},
                    menuOptions = {89: 'YES', 78: 'NO'};

                if (dirs[evt.keyCode]) {
                    evt.preventDefault();
                    eventBus.trigger('controller.direction', dirs[evt.keyCode]);
                }

                if (menuOptions[evt.keyCode]) {
                    evt.preventDefault();
                    eventBus.trigger('controller.menu', menuOptions[evt.keyCode]);
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

    /**
     * Get a random position that is not one of takenPositions
     */
    function randomPosition(boundaries, takenPositions) {
        var tempPos, newPos;

        do {
            tempPos = [
                Math.floor(Math.random() * (boundaries[0] + 1)),
                Math.floor(Math.random() * (boundaries[1] + 1))
            ];
            if (!_.some(takenPositions, _.partial(compareCoordinates, tempPos))) {
                newPos = tempPos;
            }
        } while (!newPos);

        return newPos;
    }


    FixedQueue = function (length, initialItems) {
        this.items = [];
        this.length = length;
        var i;

        if ($.isArray(initialItems)) {
            for (i = 0; i < initialItems.length; i++) {
                this.add(initialItems[i]);
            }
        }
    };

    _.extend(FixedQueue.prototype, {
        add: function add(item) {
            this.items.unshift(item);
            if (this.items.length > this.length) {
                this.items.pop();
            }
        },
        pop: function pop() {
            if (this.items.length) {
                return this.items.pop();
            }
            return false;
        },
        grow: function grow(number) {
            this.length += number;
        }
    });


    /**
     * Our snake object, maintains its positions and can draw itself
     */
    Snake = function (boundaries) {
        this.positions = new FixedQueue(3, [[2, 2]]);
        this.dir = directions.RIGHT;
        this.speed = 10;
        this.maxSpeed = 100;
        this.elapsedTime = 0;
        this.actionQueue = new FixedQueue(4);
        this.boundaries = boundaries;
    };

    _.extend(Snake.prototype, {
        tail: function tail() {
            return _.rest(this.getPositions());
        },

        nextPosition: function nextPosition() {
            var pos = this.currentPosition(), next;

            if ((this.dir === directions.RIGHT && pos[0] === this.boundaries[0]) || (this.dir === directions.LEFT && pos[0] === 0)) {
                next = [this.boundaries[0] - pos[0], pos[1]];
            } else if ((this.dir === directions.DOWN && pos[1] === this.boundaries[1]) || (this.dir === directions.UP && pos[1] === 0)) {
                next = [pos[0], this.boundaries[1] - pos[1]];
            } else {
                next = [pos[0] + this.dir[0], pos[1] + this.dir[1]];
            }
            return next;
        },

        getFrameTime: function getFrameTime() {
            return 1000 / (this.speed / 2);
        },

        grow: function grow() {
            this.positions.grow(2);
            if (this.speed < this.maxSpeed) {
                this.speed += 1;
            }
        },

        getPositions: function getPositions() {
            return this.positions.items;
        },

        currentPosition: function currentPosition() {
            return this.getPositions()[0];
        },

        changeDir: function changeDir(direction) {
            this.actionQueue.add(direction);
        },

        /**
         * Move the snake in the direction it is travelling. Snake speed is based on time elapsed 
         */
        update: function update(delta) {
            this.elapsedTime += delta;
            if (this.elapsedTime >= this.getFrameTime() && (this.dir[0] || this.dir[1])) {
                var newDir = this.actionQueue.pop();
                if (newDir) {
                    this.dir = (this.dir !== opposites[newDir]) ? directions[newDir] : this.dir;
                }
                this.positions.add(this.nextPosition());

                if (_.some(this.tail(), _.partial(compareCoordinates, this.currentPosition()))) {
                    eventBus.trigger('snake.hitSelf', true);
                }

                this.elapsedTime = 0;
            }
        },

        draw: function draw(canvases) {
            canvases.game.fillStyle = '#f10087';

            _.forEach(this.getPositions(), function (position) {
                drawRect(canvases.game, position);
            });

        }
    });

    /**
     * Fruit object, can be eaten by a snake
     */
    Fruit = function () {
        this.position = [10, 10];
    };

    _.extend(Fruit.prototype, {
        move: function move(newPosition) {
            this.position = newPosition;
        },

        draw: function draw(canvases) {
            canvases.game.fillStyle = '#000000';
            drawRect(canvases.game, this.position);
        },

        update: $.noop
    });



    FruitChecker = function (snake, fruit) {
        this.snake = snake;
        this.fruit = fruit;
    };

    _.extend(FruitChecker.prototype, {
        update: function update() {
            if (compareCoordinates(this.snake.currentPosition(), this.fruit.position)) {
                eventBus.trigger('snake.eatFruit', true);
            }
        },
        draw: $.noop
    });



    GameOverScreen = function (score) {
        this.currentScore = 0;
        this.score = score;
    };

    _.extend(GameOverScreen.prototype, {
        update: function update() {
            if (this.currentScore !== this.score) {
                this.currentScore += 100;
            }
            if (this.currentScore > this.score) {
                this.currentScore = this.score;
            }
        },

        draw: function draw(canvases) {
            var width = canvases.ui.canvas.width,
                height = canvases.ui.canvas.height;

            canvases.ui.fillStyle = '#000000';
            canvases.ui.fillRect(0, 0, width, height);
            canvases.ui.fillStyle = '#FFFFFF';
            canvases.ui.textAlign = 'center';
            canvases.ui.font = 'normal 35px silkscreennormal';
            canvases.ui.fillText("Score: " + this.currentScore, width / 2, height / 2 - 50);
            canvases.ui.font = 'normal 25px silkscreennormal';
            canvases.ui.fillText("Game Over", width / 2, height / 2);
            canvases.ui.font = 'normal 15px silkscreennormal';
            canvases.ui.fillText("Play Again?", width / 2, height / 2 + 45);
            canvases.ui.fillText("Y / N", width / 2, height / 2 + 65);
        }
    });

    /**
     * Object to control the game. Runs the game loop and manages all the objects
     */
    Game = function (canvasIds, width, height) {

        var defaults = {
                objects: [],
                time: 0,
                requestId: null,
                canvases: {},
                gridBounds: [width, height],
                score: 0,
                fruitScore: 20,
                running: false
            };

        _.extend(this, defaults);

        this.canvasBounds = grid2coord([this.gridBounds[0] + 1, this.gridBounds[1] + 1]);

        _.forEach(canvasIds, function (id, name) {
            var canvas = document.getElementById(id).getContext('2d');
            canvas.canvas.width = this.canvasBounds[0];
            canvas.canvas.height = this.canvasBounds[1];
            this.canvases[name] = canvas;
        }, this);

    };

    _.extend(Game.prototype, {
        stop: function stop() {
            this.running = false;
            this.objects = [];
        },

        close: $.noop,

        clear: function clear() {
            this.canvases.game.clearRect(0, 0, this.canvasBounds[0], this.canvasBounds[1]);
            this.canvases.ui.clearRect(0, 0, this.canvasBounds[0], this.canvasBounds[1]);
        },

        handleEvents: function handleEvents() {
            var event,
                options = {
                    'YES': _.bind(this.start, this),
                    'NO': _.bind(this.close, this)
                };

            event = eventBus.pop();
            while (event) {
                switch (event.name) {
                case 'controller.direction':
                    this.snake.changeDir(event.value);
                    break;
                case 'controller.menu':
                    if (!this.running && options[event.value]) {
                        options[event.value]();
                    }
                    break;
                case 'snake.hitSelf':
                    this.gameOver();
                    break;
                case 'snake.eatFruit':
                    this.fruit.move(randomPosition(this.gridBounds, this.snake.getPositions()));
                    this.snake.grow();
                    this.score += this.fruitScore * this.snake.speed;
                    break;
                }
                event = eventBus.pop();
            }
        },

        /**
         * Called on each frame to advance the game state
         */
        step: function step(delta) {
            this.handleEvents();
            _.forEach(this.objects, function (object) {
                object.update(delta);
            });
            this.clear();
            _.forEach(this.objects, function (object) {
                object.draw(this.canvases);
            }, this);
        },

        /**
         * Main game loop. Pass through time since last frame so we can do interpolation
         */
        gameLoop: function gameLoop() {
            this.requestId = window.requestAnimationFrame(this.gameLoop.bind(this));
            var delta, now = new Date().getTime();
            delta = now - this.time;
            this.step(delta);
            this.time = now;
        },

        /**
         * Stop the game and show the game over screen
         */
        gameOver: function gameOver() {
            this.stop();
            this.objects.push(new GameOverScreen(this.score));
        },

        /**
         * Start the game resetting all the game elements and starting up the game loop
         */
        start: function start() {
            this.running = true;
            this.time = 0;
            this.score = 0;
            this.fruit = new Fruit(this.gridBounds);
            this.snake = new Snake(this.gridBounds);
            this.objects = [this.fruit, this.snake, new FruitChecker(this.snake, this.fruit)];
            this.gameLoop();
        }
    });






    $(document).ready(function () {
        controllerKeyboard.init(document);

        var game = new Game({game: 'game', back: 'background', ui: 'ui'}, 27, 20);

        game.start();
    });


}(jQuery));