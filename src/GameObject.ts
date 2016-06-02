import Canvases from './Canvases';

interface GameObject {
    update (delta: number): void;
    draw (canvases: Canvases): void;
}

export default GameObject;
