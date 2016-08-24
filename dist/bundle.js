/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var ControllerKeyboard_1 = __webpack_require__(1);
	var Game_1 = __webpack_require__(4);
	document.addEventListener('DOMContentLoaded', function () {
	    var controller = new ControllerKeyboard_1.default();
	    controller.init();
	    var game = new Game_1.default('game', 'background', 'ui', 27, 20);
	    game.start();
	});


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var EventBus_1 = __webpack_require__(2);
	var dirs = { 37: 'LEFT', 38: 'UP', 39: 'RIGHT', 40: 'DOWN' };
	var menuOptions = { 89: 'YES', 78: 'NO' };
	var ControllerKeyboard = (function () {
	    function ControllerKeyboard() {
	    }
	    ControllerKeyboard.prototype.init = function () {
	        window.onkeydown = (function (evt) {
	            if (dirs[evt.keyCode]) {
	                evt.preventDefault();
	                EventBus_1.default.trigger('controller.direction', dirs[evt.keyCode]);
	            }
	            if (menuOptions[evt.keyCode]) {
	                evt.preventDefault();
	                EventBus_1.default.trigger('controller.menu', menuOptions[evt.keyCode]);
	            }
	        });
	    };
	    return ControllerKeyboard;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = ControllerKeyboard;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Event_1 = __webpack_require__(3);
	/**
	 * Event bus to handle events that may occur asyncronoulsy
	 */
	var EventBus = (function () {
	    function EventBus() {
	        this.events = [];
	    }
	    EventBus.prototype.trigger = function (name, value) {
	        this.events.unshift(new Event_1.default(name, value));
	    };
	    EventBus.prototype.pop = function () {
	        return this.events.pop();
	    };
	    return EventBus;
	}());
	exports.EventBus = EventBus;
	var instance = new EventBus();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = instance;


/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	var Event = (function () {
	    function Event(name, value) {
	        this.name = name;
	        this.value = value;
	    }
	    return Event;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Event;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Grid_1 = __webpack_require__(5);
	var EventBus_1 = __webpack_require__(2);
	var GameOverScreen_1 = __webpack_require__(7);
	var Fruit_1 = __webpack_require__(8);
	var Snake_1 = __webpack_require__(9);
	var FruitChecker_1 = __webpack_require__(11);
	var Canvases_1 = __webpack_require__(12);
	/**
	 * Object to control the game. Runs the game loop and manages all the objects
	 */
	var Game = (function () {
	    function Game(gameId, backId, uiId, width, height) {
	        this.time = 0;
	        this.score = 0;
	        this.fruitScore = 20;
	        this.running = false;
	        this.grid = new Grid_1.default(width, height, 10, 10, 2);
	        this.canvases = new Canvases_1.default(gameId, backId, uiId, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
	    }
	    Game.prototype.stop = function () {
	        this.running = false;
	        this.objects = [];
	    };
	    Game.prototype.close = function () {
	        return null;
	    };
	    Game.prototype.clear = function () {
	        this.canvases.game.clearRect(0, 0, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
	        this.canvases.ui.clearRect(0, 0, this.grid.canvasBounds.x, this.grid.canvasBounds.y);
	    };
	    Game.prototype.handleEvents = function () {
	        var menuOptions = {
	            'YES': this.start,
	            'NO': this.close
	        };
	        var event = EventBus_1.default.pop();
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
	            event = EventBus_1.default.pop();
	        }
	    };
	    /**
	     * Called on each frame to advance the game state
	     */
	    Game.prototype.step = function (delta) {
	        var _this = this;
	        this.handleEvents();
	        this.objects.forEach(function (object) { return object.update(delta); });
	        this.clear();
	        this.objects.forEach(function (object) { return object.draw(_this.canvases); });
	    };
	    /**
	     * Main game loop. Pass through time since last frame so we can do interpolation
	     */
	    Game.prototype.gameLoop = function () {
	        this.requestId = window.requestAnimationFrame(this.gameLoop.bind(this));
	        var now = new Date().getTime();
	        var delta = now - this.time;
	        this.step(delta);
	        this.time = now;
	    };
	    /**
	     * Stop the game and show the game over screen
	     */
	    Game.prototype.gameOver = function () {
	        this.stop();
	        this.objects.push(new GameOverScreen_1.default(this.score));
	    };
	    /**
	     * Start the game resetting all the game elements and starting up the game loop
	     */
	    Game.prototype.start = function () {
	        this.running = true;
	        this.time = 0;
	        this.score = 0;
	        this.fruit = new Fruit_1.default(this.grid);
	        this.snake = new Snake_1.default(this.grid);
	        this.objects = [this.fruit, this.snake, new FruitChecker_1.default(this.snake, this.fruit, this.grid)];
	        this.gameLoop();
	    };
	    return Game;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Game;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Point2D_1 = __webpack_require__(6);
	/**
	 * The game grid, and useful functions associated with it
	 */
	var Grid = (function () {
	    function Grid(width, height, blockWidth, blockHeight, gap) {
	        this.width = width;
	        this.height = height;
	        this.blockWidth = blockWidth;
	        this.blockHeight = blockHeight;
	        this.gap = gap;
	        this.canvasBounds = this.canvasCoordinates(new Point2D_1.default(this.width + 1, this.height + 1));
	    }
	    /**
	     * Convert coordinates on the game grid to canvas coordinates
	     */
	    Grid.prototype.canvasCoordinates = function (position) {
	        var x = position.x, y = position.y;
	        x = this.gap + x * (this.blockWidth + this.gap);
	        y = this.gap + y * (this.blockHeight + this.gap);
	        return new Point2D_1.default(x, y);
	    };
	    Grid.prototype.drawBlock = function (canvas, position) {
	        var coordinates = this.canvasCoordinates(position);
	        canvas.fillRect(coordinates.x, coordinates.y, this.blockWidth, this.blockHeight);
	    };
	    /**
	     * Helper function to compare coordinates, useful for filter etc.
	     */
	    Grid.prototype.compareCoordinates = function (coordinate1, coordinate2) {
	        return coordinate1.x === coordinate2.x && coordinate1.y === coordinate2.y;
	    };
	    /**
	     * Get a random position that is not one of takenPoint2Ds
	     */
	    Grid.prototype.randomPoint2D = function (takenPoint2Ds) {
	        var _this = this;
	        var newPos;
	        var _loop_1 = function() {
	            var tempPos = new Point2D_1.default(Math.floor(Math.random() * (this_1.width + 1)), Math.floor(Math.random() * (this_1.height + 1)));
	            var compare = function (pos) { return _this.compareCoordinates(tempPos, pos); };
	            if (!takenPoint2Ds.some(compare)) {
	                newPos = tempPos;
	            }
	        };
	        var this_1 = this;
	        do {
	            _loop_1();
	        } while (!newPos);
	        return newPos;
	    };
	    return Grid;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Grid;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	var Point2D = (function () {
	    function Point2D(x, y) {
	        this.x = x;
	        this.y = y;
	    }
	    return Point2D;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Point2D;


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";
	var GameOverScreen = (function () {
	    function GameOverScreen(score) {
	        if (score === void 0) { score = 0; }
	        this.score = score;
	        this.currentScore = 0;
	    }
	    GameOverScreen.prototype.update = function () {
	        if (this.currentScore !== this.score) {
	            this.currentScore += 100;
	        }
	        if (this.currentScore > this.score) {
	            this.currentScore = this.score;
	        }
	    };
	    GameOverScreen.prototype.draw = function (canvases) {
	        var ui = canvases.ui;
	        var _a = ui.canvas, width = _a.width, height = _a.height;
	        ui.fillStyle = '#000000';
	        ui.fillRect(0, 0, width, height);
	        ui.fillStyle = '#FFFFFF';
	        ui.textAlign = 'center';
	        ui.font = 'normal 35px silkscreennormal';
	        ui.fillText("Score: " + this.currentScore, width / 2, height / 2 - 50);
	        ui.font = 'normal 25px silkscreennormal';
	        ui.fillText('Game Over', width / 2, height / 2);
	        ui.font = 'normal 15px silkscreennormal';
	        ui.fillText('Play Again?', width / 2, height / 2 + 45);
	        ui.fillText('Y / N', width / 2, height / 2 + 65);
	    };
	    return GameOverScreen;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = GameOverScreen;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var Point2D_1 = __webpack_require__(6);
	/**
	 * Fruit object, can be eaten by a snake
	 */
	var Fruit = (function () {
	    function Fruit(grid, position) {
	        if (position === void 0) { position = new Point2D_1.default(10, 10); }
	        this.grid = grid;
	        this.position = position;
	    }
	    Fruit.prototype.move = function (newPoint2D) {
	        this.position = newPoint2D;
	    };
	    Fruit.prototype.update = function () {
	        return null;
	    };
	    Fruit.prototype.draw = function (canvases) {
	        canvases.game.fillStyle = '#000000';
	        this.grid.drawBlock(canvases.game, this.position);
	    };
	    return Fruit;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Fruit;


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var FixedQueue_1 = __webpack_require__(10);
	var EventBus_1 = __webpack_require__(2);
	var Point2D_1 = __webpack_require__(6);
	var DIRECTIONS = {
	    UP: new Point2D_1.default(0, -1),
	    DOWN: new Point2D_1.default(0, 1),
	    LEFT: new Point2D_1.default(-1, 0),
	    RIGHT: new Point2D_1.default(1, 0)
	};
	var OPPOSITES = {
	    UP: DIRECTIONS.DOWN,
	    DOWN: DIRECTIONS.UP,
	    LEFT: DIRECTIONS.RIGHT,
	    RIGHT: DIRECTIONS.LEFT
	};
	/**
	 * Snake object, maintains its positions and can draw itself
	 */
	var Snake = (function () {
	    function Snake(grid) {
	        this.grid = grid;
	        this.speed = 10;
	        this.positions = new FixedQueue_1.default(3, [new Point2D_1.default(2, 2)]);
	        this.dir = DIRECTIONS.RIGHT;
	        this.maxSpeed = 100;
	        this.elapsedTime = 0;
	        this.actionQueue = new FixedQueue_1.default(4);
	    }
	    Snake.prototype.tail = function () {
	        return this.getPositions().slice(1);
	    };
	    Snake.prototype.nextPosition = function () {
	        var pos = this.currentPosition();
	        var next;
	        if ((this.dir === DIRECTIONS.RIGHT && pos.x === this.grid.width) ||
	            (this.dir === DIRECTIONS.LEFT && pos.x === 0)) {
	            next = new Point2D_1.default(this.grid.width - pos.x, pos.y);
	        }
	        else if ((this.dir === DIRECTIONS.DOWN && pos.y === this.grid.height) ||
	            (this.dir === DIRECTIONS.UP && pos.y === 0)) {
	            next = new Point2D_1.default(pos.x, this.grid.height - pos.y);
	        }
	        else {
	            next = new Point2D_1.default(pos.x + this.dir.x, pos.y + this.dir.y);
	        }
	        return next;
	    };
	    Snake.prototype.getFrameTime = function () {
	        return 1000 / (this.speed / 2);
	    };
	    Snake.prototype.grow = function () {
	        this.positions.grow(2);
	        if (this.speed < this.maxSpeed) {
	            this.speed += 1;
	        }
	    };
	    Snake.prototype.getPositions = function () {
	        return this.positions.items;
	    };
	    Snake.prototype.currentPosition = function () {
	        return this.getPositions()[0];
	    };
	    Snake.prototype.changeDir = function (direction) {
	        this.actionQueue.add(direction);
	    };
	    /**
	     * Move the snake in the direction it is travelling. Snake speed is based on time elapsed
	     */
	    Snake.prototype.update = function (delta) {
	        var _this = this;
	        this.elapsedTime += delta;
	        if (this.elapsedTime >= this.getFrameTime() && (this.dir.x || this.dir.y)) {
	            var newDir = this.actionQueue.pop();
	            if (newDir) {
	                this.dir = (this.dir !== OPPOSITES[newDir]) ? DIRECTIONS[newDir] : this.dir;
	            }
	            this.positions.add(this.nextPosition());
	            var compare = function (pos) { return _this.grid.compareCoordinates(_this.currentPosition(), pos); };
	            if (this.tail().some(compare)) {
	                EventBus_1.default.trigger('snake.hitSelf', true);
	            }
	            this.elapsedTime = 0;
	        }
	    };
	    Snake.prototype.draw = function (canvases) {
	        var _this = this;
	        canvases.game.fillStyle = '#f10087';
	        this.getPositions().forEach(function (position) {
	            _this.grid.drawBlock(canvases.game, position);
	        });
	    };
	    return Snake;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Snake;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	var FixedQueue = (function () {
	    function FixedQueue(length, initialItems) {
	        if (initialItems === void 0) { initialItems = []; }
	        this.length = length;
	        this.items = [];
	        initialItems.forEach(this.add, this);
	    }
	    FixedQueue.prototype.add = function (item) {
	        this.items.unshift(item);
	        if (this.items.length > this.length) {
	            this.items.pop();
	        }
	    };
	    FixedQueue.prototype.pop = function () {
	        if (this.items.length) {
	            return this.items.pop();
	        }
	        return null;
	    };
	    FixedQueue.prototype.grow = function (size) {
	        this.length = this.length + size;
	    };
	    return FixedQueue;
	}());
	;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = FixedQueue;


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var EventBus_1 = __webpack_require__(2);
	var FruitChecker = (function () {
	    function FruitChecker(snake, fruit, grid) {
	        this.snake = snake;
	        this.fruit = fruit;
	        this.grid = grid;
	    }
	    FruitChecker.prototype.draw = function () {
	        return null;
	    };
	    FruitChecker.prototype.update = function () {
	        if (this.grid.compareCoordinates(this.snake.currentPosition(), this.fruit.position)) {
	            EventBus_1.default.trigger('snake.eatFruit', true);
	        }
	    };
	    return FruitChecker;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = FruitChecker;


/***/ },
/* 12 */
/***/ function(module, exports) {

	"use strict";
	var Canvases = (function () {
	    function Canvases(gameId, backId, uiId, x, y) {
	        this.loadCanvas('game', gameId, x, y);
	        this.loadCanvas('back', backId, x, y);
	        this.loadCanvas('ui', uiId, x, y);
	    }
	    Canvases.prototype.loadCanvas = function (name, id, x, y) {
	        var canvasElement = document.getElementById(id);
	        var canvas = canvasElement.getContext('2d');
	        canvas.canvas.width = x;
	        canvas.canvas.height = y;
	        this[name] = canvas;
	    };
	    return Canvases;
	}());
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Canvases;


/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map