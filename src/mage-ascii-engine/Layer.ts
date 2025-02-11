import { TileTexture } from "./Tile";
import Color from "./Color";
import Tile from "./Tile";
import Vector from "./Vector";

export interface DrawingOperation {
  tile: Tile;
  char: string;
  color: Color;
  background: Color;
  pos: Vector;
  isVisible: boolean;
};

const drawingOperation = (tile: Tile): DrawingOperation => ({
  tile,
  char: tile.char,
  color: tile.color.clone(),
  background: tile.background.clone(),
  pos: tile.pos.clone(),
  isVisible: tile.isVisible
});

interface LayerConstructorOptions {
  opacity?: number;
  isVisible?: boolean;
  pos?: Vector;
  size: Vector;
  z?: number;
};

export default class Layer {
  opacity: number;
  isVisible: boolean;
  pos: Vector;
  size: Vector;
  operations: Array<DrawingOperation> = [];
  private _z: number;

  constructor(options: LayerConstructorOptions) {
    this.opacity = options.opacity || 1;
    this.isVisible = options.isVisible || true;
    this.pos = options.pos || Vector.Zero();
    this.size = options.size;

    this._z = options.z || 0;
  }

  get z() { return this._z; }

  draw(tile: Tile) {
    this.operations.push(drawingOperation(tile));
  }

  clear() {
    this.operations = [];
  }
}

/**
 * A layer with tiles binded to itself. No more tiles can be added from outside. 
 */
export class BitmapLayer extends Layer {
  tiles: Array<Tile>; 

  constructor(options: LayerConstructorOptions) {
    super(options); 
    this.tiles = Array.from({length: this.size.x * this.size.y}, (_, i) => {
      return new Tile({
        char: ' ',
        color: new Color(255, 255, 255, 1), 
        background: Color.Transparent(), 
        isVisible: true, 
        pos: new Vector(i % this.size.x, Math.floor(i / this.size.x))
      }); 
    }); 
  }

  /**
   * Add all tiles to the layer's operations array
   */
  draw() {
    for (const tile of this.tiles) {
      this.operations.push(drawingOperation(tile)); 
    }
  }

  /**
   * Add only one tile to the layer's operations array
   * @param indx index of the tile to be drew
   */
  drawOne(indx: number) {
    this.operations.push(drawingOperation(this.tiles[indx])); 
  }

  setTile(indx: number, texture: TileTexture) {
    this.tiles[indx].overloadFromTexture(texture); 
  }
}
