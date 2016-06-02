class Canvases {
    game: CanvasRenderingContext2D;
    back: CanvasRenderingContext2D;
    ui: CanvasRenderingContext2D;

    constructor(gameId: string, backId: string, uiId: string, x, y) {
        this.loadCanvas('game', gameId, x, y);
        this.loadCanvas('back', backId, x, y);
        this.loadCanvas('ui', uiId, x, y);
    }

    loadCanvas(name: string, id: string, x, y) {
        const canvasElement = document.getElementById(id) as HTMLCanvasElement;
        const canvas = canvasElement.getContext('2d');
        canvas.canvas.width = x;
        canvas.canvas.height = y;
        this[name] = canvas;
    }
}

export default Canvases;
