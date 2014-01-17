window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

(function ($) {
    'use strict';
    var eventBus, controllerKeyboard, Snake, Game, Fruit,
        GameOverScreen, FixedQueue, FruitChecker, Grid,
        DIRECTIONS = {
            UP: [0, -1],
            DOWN: [0, 1],
            LEFT: [-1, 0],
            RIGHT: [1, 0]
        },
        OPPOSITES = {
            UP: DIRECTIONS.DOWN,
            DOWN: DIRECTIONS.UP,
            LEFT: DIRECTIONS.RIGHT,
            RIGHT: DIRECTIONS.LEFT
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
     * The game grid, and useful functions associated with it
     */
    Grid = function (width, height, blockWidth, blockHeight, gap) {
        this.blockWidth = blockWidth;
        this.blockHeight = blockHeight;
        this.width = width;
        this.height = height;
        this.gap = gap;
        this.canvasBounds = this.canvasCoordinates([this.width + 1, this.height + 1]);

    };

    _.extend(Grid.prototype, {
        /**
         * Convert coordinates on the game grid to canvas coordinates
         */
        canvasCoordinates: function canvasCoordinates(position) {
            var x = position[0],
                y = position[1];

            x = this.gap + x * (this.blockWidth + this.gap);
            y = this.gap + y * (this.blockHeight + this.gap);

            return [x, y];
        },

        drawBlock: function drawBlock(canvas, position) {
            var coordinates = this.canvasCoordinates(position);
            canvas.fillRect(coordinates[0], coordinates[1], this.blockWidth, this.blockHeight);
        },

        /**
         * Helper function to compare coordinates, useful for filter etc.
         */
        compareCoordinates: function compareCoordinates(coordinate1, coordinate2) {
            return coordinate1[0] === coordinate2[0] && coordinate1[1] === coordinate2[1];
        },

        /**
         * Get a random position that is not one of takenPositions
         */
        randomPosition: function randomPosition(takenPositions) {
            var tempPos, newPos;

            do {
                tempPos = [
                    Math.floor(Math.random() * (this.width + 1)),
                    Math.floor(Math.random() * (this.height + 1))
                ];
                if (!_.some(takenPositions, _.partial(this.compareCoordinates, tempPos))) {
                    newPos = tempPos;
                }
            } while (!newPos);

            return newPos;
        }

    });


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
    Snake = function (grid) {
        this.positions = new FixedQueue(3, [[2, 2]]);
        this.dir = DIRECTIONS.RIGHT;
        this.speed = 10;
        this.maxSpeed = 100;
        this.elapsedTime = 0;
        this.actionQueue = new FixedQueue(4);
        this.grid = grid;
    };

    _.extend(Snake.prototype, {
        tail: function tail() {
            return _.rest(this.getPositions());
        },

        nextPosition: function nextPosition() {
            var pos = this.currentPosition(), next;

            if ((this.dir === DIRECTIONS.RIGHT && pos[0] === this.grid.width) || (this.dir === DIRECTIONS.LEFT && pos[0] === 0)) {
                next = [this.grid.width - pos[0], pos[1]];
            } else if ((this.dir === DIRECTIONS.DOWN && pos[1] === this.grid.height) || (this.dir === DIRECTIONS.UP && pos[1] === 0)) {
                next = [pos[0], this.grid.height - pos[1]];
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
                    this.dir = (this.dir !== OPPOSITES[newDir]) ? DIRECTIONS[newDir] : this.dir;
                }
                this.positions.add(this.nextPosition());

                if (_.some(this.tail(), _.partial(this.grid.compareCoordinates, this.currentPosition()))) {
                    eventBus.trigger('snake.hitSelf', true);
                }

                this.elapsedTime = 0;
            }
        },

        draw: function draw(canvases) {
            canvases.game.fillStyle = '#f10087';

            _.forEach(this.getPositions(), function (position) {
                this.grid.drawBlock(canvases.game, position);
            }, this);

        }
    });

    /**
     * Fruit object, can be eaten by a snake
     */
    Fruit = function (grid) {
        this.position = [10, 10];
        this.grid = grid;
    };

    _.extend(Fruit.prototype, {
        move: function move(newPosition) {
            this.position = newPosition;
        },

        draw: function draw(canvases) {
            canvases.game.fillStyle = '#000000';
            this.grid.drawBlock(canvases.game, this.position);
        }
    });



    FruitChecker = function (snake, fruit, grid) {
        this.snake = snake;
        this.fruit = fruit;
        this.grid = grid;
    };

    _.extend(FruitChecker.prototype, {
        update: function update() {
            if (this.grid.compareCoordinates(this.snake.currentPosition(), this.fruit.position)) {
                eventBus.trigger('snake.eatFruit', true);
            }
        }
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
                score: 0,
                fruitScore: 20,
                running: false,
                grid: new Grid(width, height, 10, 10, 2)
            };

        _.extend(this, defaults);

        //Set up the canvases we need
        _.forEach(canvasIds, function (id, name) {
            var canvas = document.getElementById(id).getContext('2d');
            canvas.canvas.width = this.grid.canvasBounds[0];
            canvas.canvas.height = this.grid.canvasBounds[1];
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
            this.canvases.game.clearRect(0, 0, this.grid.canvasBounds[0], this.grid.canvasBounds[1]);
            this.canvases.ui.clearRect(0, 0, this.grid.canvasBounds[0], this.grid.canvasBounds[1]);
        },

        handleEvents: function handleEvents() {
            var event,
                menuOptions = {
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
                    if (!this.running && menuOptions[event.value]) {
                        menuOptions[event.value]();
                    }
                    break;
                case 'snake.hitSelf':
                    this.gameOver();
                    break;
                case 'snake.eatFruit':
                    this.fruit.move(this.grid.randomPosition(this.snake.getPositions()));
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
                if (object.update) {
                    object.update(delta);
                }
            });

            this.clear();

            _.forEach(this.objects, function (object) {
                if (object.draw) {
                    object.draw(this.canvases);
                }
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
            this.fruit = new Fruit(this.grid);
            this.snake = new Snake(this.grid);
            this.objects = [this.fruit, this.snake, new FruitChecker(this.snake, this.fruit, this.grid)];
            this.gameLoop();
        }
    });






    $(document).ready(function () {
        controllerKeyboard.init(document);

        var game = new Game({game: 'game', back: 'background', ui: 'ui'}, 27, 20);

        game.start();
    });


}(jQuery));