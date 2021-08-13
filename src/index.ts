import Color from "./mage-ascii-engine/Color";
import Layer from "./mage-ascii-engine/Layer";
import Renderer from "./mage-ascii-engine/Renderer/Renderer";
import DOMRenderer from "./mage-ascii-engine/Renderer/DOMRenderer";
import Tile from "./mage-ascii-engine/Tile";
import Vector from "./mage-ascii-engine/Vector";
import CanvasRenderer from "./mage-ascii-engine/Renderer/CanvasRenderer";

const WIDTH = 80;
const HEIGHT = 24;

const layers: Record<string, Layer> = {
  background: new Layer({ size: new Vector(WIDTH, HEIGHT) }),
  actor: new Layer({ size: new Vector(WIDTH, HEIGHT) }),
};

const player = new Tile({
  background: new Color(0,0,0,0),
  char: '@',
  color: new Color(255, 0, 0),
  isVisible: true,
  pos: new Vector(0, 0)
});

const backgroundTiles = Array.from({ length: WIDTH*HEIGHT }, (_, i) => {
  const x = i % WIDTH;
  const y = Math.floor(i / WIDTH);

  return new Tile({
    char: '.',
    pos: new Vector(x, y),
    background: new Color(0, 0, 0, 1),
    color: new Color(255, 255, 255, 1)
  });
});


let renderer: Renderer; 
const domRenderer: Renderer = new DOMRenderer(); 
const canvasRenderer: Renderer = new CanvasRenderer(); 
const beforeDraw = () => {
  layers.background.operations.forEach(op => {
    let newAlpha; 
    newAlpha = (Math.sin((renderer.frames / 10) + (op.pos.x / op.pos.y)) + 1) / 2;
    op.color.b = newAlpha; 
    op.color.r = newAlpha; 
    op.color.a = newAlpha;
  })

  layers.actor.operations.forEach(op => {
    // op.char = String.fromCharCode((renderer.frames % 100) + 25);
     
  })
}; 

domRenderer.setSize(35);
domRenderer.addLayer('background', layers.background);
domRenderer.addLayer('actor', layers.actor);
domRenderer.onBeforeDraw(beforeDraw); 

canvasRenderer.setSize(35);
canvasRenderer.addLayer('background', layers.background);
canvasRenderer.addLayer('actor', layers.actor);
canvasRenderer.onBeforeDraw(beforeDraw); 


renderer = canvasRenderer; 

let fps = 0;
setInterval(() => {
  document.getElementById('asc-engine-fps').textContent = fps.toString(); 
  fps = 0; 
}, 1000); 

const draw = () => {
  backgroundTiles.forEach(tile => layers.background.draw(tile));
  layers.actor.draw(player);
  renderer.commit();
  fps ++; 
  requestAnimationFrame(draw);
}

draw();
let ascEngineCanvases: HTMLCollectionOf<HTMLCanvasElement> = document.getElementsByTagName('canvas'); 
let ascEngineRendererSelect: HTMLElement = document.getElementById('asc-engine-renderer-name'); 
ascEngineRendererSelect.addEventListener('click', _ => {
  if (renderer instanceof DOMRenderer) {
    for (const canvas of Array.from(ascEngineCanvases)) {
      canvas.style.display = 'block'; 
    }
    ascEngineRendererSelect.textContent = 'Canvas Renderer'; 
    renderer = canvasRenderer; 
  }
  else {
    for (const canvas of Array.from(ascEngineCanvases)) {
      canvas.style.display = 'none'; 
    }
    ascEngineRendererSelect.textContent = 'DOM Renderer'; 
    renderer = domRenderer; 
  }
})

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'ArrowUp': {
      player.pos.add(new Vector(0, -1));
      break;
    }
    case 'ArrowDown': {
      player.pos.add(new Vector(0, 1));
      break;
    }
    case 'ArrowLeft': {
      player.pos.add(new Vector(-1, 0));
      break;
    }
    case 'ArrowRight': {
      player.pos.add(new Vector(1, 0));
      break;
    }
  }
})

document.addEventListener('click', _ => {
  // draw(); 
})