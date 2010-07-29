
/**
 * Snake object to control the game
 */
var snake = {
	x: 1,			// current x position
	y: 1,			// current y position
	gap: 1,         // gap between blocks
	max_x: 200,		// Width of playing area
	max_y: 200,		// Heigth of playing area
	dir_x: 10,		// Direction hozizontal
	dir_y: 0,		// Direction Vertical
	block_width: 9,	// Width of one block of the snake
	block_height: 9,// Height of one block of the sname
	positions : [],	// Array to store the current blocks of the sname
	length: 1,		// The current length of the snake
	max_length: 10,	// The max length that the snake can reach
	fruit: {
		x: 0,
		y: 0
	},
	/**
	 * Update the game, by moving the snake and checking for events.
	 *
	 * @return boolean Whether the snake has hit itself or not
	 */
	update : function(context) {
		
		if (this.fruit.x == 0) {
			this.newFruit();
		}
		this.positions.push([this.x, this.y]);

		//Draw the next block of snake
		context.beginPath();
		context.rect(this.x,this.y, this.block_width, this.block_width);
		context.closePath();
		context.fill();

		//Clear the last block of the snake and remove from array if we are at max_length
		if (this.length > this.max_length) {
			var last = this.positions.shift();
			context.clearRect(last[0], last[1],  this.block_width , this.block_height);
			this.length = this.max_length;

		}

		//Move the snakes position
		this.x += this.dir_x;
		this.y += this.dir_y;

		this.checkBounds();
		this.checkFruit();

		//Draw the fruit
		context.beginPath();		
		context.rect(this.fruit.x, this.fruit.y, this.block_width, this.block_width);
		context.closePath();
		context.fill();

		this.length += 1;

		return this.checkHit();
	},
	

	newFruit :  function() {

		var width = (this.block_width + this.gap);
		var height = (this.block_height + this.gap);
		var blocks_x = (this.max_x) / width - this.gap;
		var blocks_y = (this.max_y) / height - this.gap;
		
		this.fruit.x = Math.floor ( Math.random ( ) * blocks_x + 1) * width + this.gap;
		this.fruit.y = Math.floor ( Math.random ( ) * blocks_y + 1) * height + this.gap;
	},
	
	checkFruit : function() {
		if (this.hasPoint(this.fruit.x, this.fruit.y)) {

			this.newFruit();
			this.max_length += 1;
		}
	},

	/**
	 * Check if a specific point is part of the snake
	 */
	hasPoint : function(x, y) {
		return this.positions.some(function(element, index, array) {
			return (element[0] == x && element[1] == y);
		});
	},

	/**
	 * Check if the snake has gone though a wall, and reset back to the other side
	 */
	checkBounds : function()
	{
		if (this.x > this.max_x) {
			this.x = 1;
		}
		if (this.x <= 0) {
			this.x = this.max_x +this.gap;
		}
		if (this.y > this.max_y) {
			this.y = 1;
		}
		if (this.y <= 0) {
			this.y = this.max_y + this.gap;
		}
	},

	/**
	 * Check if the snake has hit itself
	 */
	checkHit : function()
	{
		if (this.hasPoint(this.x, this.y)) {
			return false;
		}
		return true;
	},

	/**
	 * Change the direction the snake is currently travelling, based on user input
	 * Make sure that the snake can not go backwards. Snake can only have an x
	 * direction or a y direction, this ensures that it only travels vertically
	 * or horizontally.
	 *
	 */
	changeDir : function(code) {
		switch(code) {
			case 37:
				if (this.dir_x !==  this.block_width + this.gap) {
					this.dir_x = 0 - this.block_width - this.gap;
					this.dir_y = 0;
				}
				break;
			case 38:
				if (this.dir_y !== (this.block_height + this.gap)) {
					this.dir_x = 0;
					this.dir_y = 0 - this.block_height - this.gap;
				}
				break;
			case 39:
				if (this.dir_x !== (0 - this.block_width - this.gap)) {
					this.dir_x = this.block_width + this.gap;
					this.dir_y = 0;
				}
				break;
			case 40:
				if (this.dir_y !== (0 - this.block_height - this.gap)) {
					this.dir_x = 0;
					this.dir_y = this.block_height + this.gap;
				}
				break;
		}
	}


}