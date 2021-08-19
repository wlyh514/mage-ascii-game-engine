import Color from "./Color";
import Vector from "./Vector";

interface TileConstructorOptions {
  char?: string;
  color?: Color;
  background?: Color;
  pos?: Vector;
  isVisible?: boolean;
};

export interface TileTexture {
  char: string, 
  color: Color, 
  background: Color, 
  isVisible: boolean
}

export default class Tile {
  char: string;
  color: Color;
  background: Color;
  pos: Vector;
  isVisible: boolean;

  readonly id: string = Math.random().toString(36).slice(2);

  constructor(options: TileConstructorOptions) {
    this.char = options.char || ' ';
    this.color = options.color || new Color();
    this.background = options.background || new Color(0, 0, 0, 1);
    this.pos = options.pos || new Vector(0, 0);
    this.isVisible = options.isVisible || true;
  }

  overloadFromTexture(texture: TileTexture) {
    this.char = texture.char; 
    this.color = texture.color.clone(); 
    this.background = texture.background.clone(); 
    this.isVisible = texture.isVisible; 
  }

  clone(): Tile {
    return new Tile({
      char: this.char, 
      color: this.color.clone(),
      background: this.background.clone(),
      
    })
  }
}
