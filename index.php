<!DOCTYPE HTML>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">        
        <title>jsSnake</title>
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
        <script src="jsnake.js"></script>
        <script>

			var context;
			/**
			 * Draw method that is passed to the setInterval.
			 * TODO find a clearner way of doing a game loop
			 */
			function main_loop() {
				result = snake.update(context);
				if (!result) {
					clearInterval(interval);
					alert('Game Over');
				}
			}

			$(document).ready(function() {

				context = document.getElementById('field').getContext("2d");
				$(document).keydown(function(evt) {
					snake.changeDir(evt.keyCode);
				});
				interval = setInterval(main_loop,100);

			});

		</script>
        <link rel="stylesheet" href="style.css" type="text/css" media="screen"/>
    </head>
    <body>
        <canvas id="field" width="200px" height="200px"></canvas>

    </body>
</html>
