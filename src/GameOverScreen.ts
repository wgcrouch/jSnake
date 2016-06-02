import Canvases from './Canvases';
import GameObject from './GameObject';

class GameOverScreen implements GameObject {
    private currentScore = 0;

    constructor(private score = 0) {}

    update () {
        if (this.currentScore !== this.score) {
            this.currentScore += 100;
        }
        if (this.currentScore > this.score) {
            this.currentScore = this.score;
        }
    }

    draw (canvases: Canvases) {
        const { ui } = canvases;
        const { width, height } = ui.canvas;

        ui.fillStyle = '#000000';
        ui.fillRect(0, 0, width, height);
        ui.fillStyle = '#FFFFFF';
        ui.textAlign = 'center';
        ui.font = 'normal 35px silkscreennormal';
        ui.fillText(`Score: ${this.currentScore}`, width / 2, height / 2 - 50);
        ui.font = 'normal 25px silkscreennormal';
        ui.fillText('Game Over', width / 2, height / 2);
        ui.font = 'normal 15px silkscreennormal';
        ui.fillText('Play Again?', width / 2, height / 2 + 45);
        ui.fillText('Y / N', width / 2, height / 2 + 65);
    }

}

export default GameOverScreen;
