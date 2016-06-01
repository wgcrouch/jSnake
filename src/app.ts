import ControllerKeyboard from './ControllerKeyboard';
import Game from './Game';

document.addEventListener("DOMContentLoaded", function() {
    const controller = new ControllerKeyboard();
    controller.init();

    var game = new Game('game', 'background', 'ui', 27, 20);

    game.start();
});
