import Renderer from "./Renderer";
import Layer, { DrawingOperation } from "../Layer";
import Vector from "../Vector";
import Color from "../Color";

const charWidth = 0.6; 

export default class CanvasRenderer extends Renderer {

    private layerCanvases: Record<string, HTMLCanvasElement>; 
    private layerContexes: Record<string, CanvasRenderingContext2D>; 
    private canvasGridElements: Record<string, CanvasGridElement>; 

    constructor() {
        super();
        // Additionally, create the canvas and the canvas context. 
        let container: HTMLElement = document.getElementById("asc-engine-layer-container"); 
        if (container === null) {
            throw new Error("Container Not Found: No div with id 'asc-engine-layer-container' was found. ");
        }
        this.layerCanvases = {};
        this.layerContexes = {}; 
        this.canvasGridElements = {}; 
    }

    addLayer(name: string, layer: Layer): Renderer {
        super.addLayer(name, layer);
        
        let canvas: HTMLCanvasElement = document.createElement('canvas'); 
        canvas.setAttribute('id', `asc-engine-canvas-${name}`); 
        canvas.width = layer.size.x * this.size;
        canvas.height = layer.size.y * this.size; 
        canvas.style.left = `${layer.pos.x * this.size * charWidth}px`; 
        canvas.style.top = `${layer.pos.y * this.size}px`; 
        canvas.style.zIndex = (layer.z + 10).toString(); 
        
        let container: HTMLElement = document.getElementById("asc-engine-layer-container"); 
        container.appendChild(canvas); 

        let context = canvas.getContext('2d'); 

        this.layerCanvases[name] = canvas; 
        this.layerContexes[name] = context; 

        return this; 
    }

    commit(): void {
        this.beforeDraw(); 
        for (let [name, layer] of Object.entries(this.namedLayers)) {
            
            let context: CanvasRenderingContext2D = this.layerContexes[name]; 
            let canvas: HTMLCanvasElement = this.layerCanvases[name]; 

            if (!layer.isVisible) {
                canvas.style.display = 'none'; 
            }
            else {
                canvas.style.display = 'block'; 
            }

            canvas.style.opacity = layer.opacity.toString(); 
            if (!layer.isVisible || layer.opacity === 0) {
                continue; 
            }
            for (const op of layer.operations) {
                
                let gridElement: CanvasGridElement; 
                if (!(op.tile.id in this.canvasGridElements)) {
                    gridElement = new CanvasGridElement(op); 
                    this.canvasGridElements[op.tile.id] = gridElement; 
                }
                else {
                    gridElement = this.canvasGridElements[op.tile.id]; 
                    gridElement.loadNewOp(op); 
                }
                this.performCanvasOperation(context, gridElement.getErasePrevOp()); 
            }
            for (const op of layer.operations) {
                const gridElement = this.canvasGridElements[op.tile.id]; 
                this.performCanvasOperation(context, gridElement.getPrintCurrentOp()); 
            }
            layer.clear(); 
        }
        this.frames ++; 
        
    }

    private performCanvasOperation(ctx: CanvasRenderingContext2D, op: CanvasOperation) {
        if (op === null) {
            return; 
        }
        let pixelPos = new Vector(op.pos.x * this.size * charWidth, op.pos.y * this.size); 
        if (op.background !== undefined) {
            // Fill background
            if (op.background.equals(Color.Transparent())) {
                ctx.clearRect(pixelPos.x, pixelPos.y, this.size * charWidth, this.size); 
            }
            else {
                ctx.fillStyle = op.background.toCssString(); 
                ctx.fillRect(pixelPos.x, pixelPos.y, this.size * charWidth, this.size);
            }
        }
        if (op.char !== undefined) {
            ctx.font = `${this.size}px 'Inconsolata', Courier, monospace`; 
            ctx.fillStyle = op.color.toCssString(); 
            ctx.fillText(op.char, pixelPos.x, pixelPos.y + this.size - 4); 
        }
    }
}

interface CanvasOperation {
    pos: Vector; 
    char?: string; 
    color?: Color;
    background?: Color; 
}

class CanvasOperationFactory {
    private op: CanvasOperation; 

    constructor(pos: Vector) {
        this.op = {
            pos
        }; 
    }

    drawChar(char: string, color: Color): CanvasOperationFactory {
        this.op.color = color; 
        this.op.char = char; 
        return this; 
    }

    drawBackground(bg: Color): CanvasOperationFactory {
        this.op.background = bg; 
        return this; 
    }

    build(): CanvasOperation {
        return this.op; 
    }

}

/**
 * Immitates a DOM element in the DOMRenderer. 
 */
class CanvasGridElement {
    private previousOp: DrawingOperation;
    private currentOp: DrawingOperation; 
    private noChange: boolean; 

    constructor (op: DrawingOperation) {
        this.currentOp = op; 
        this.previousOp = null; 
        this.noChange = false; 
    }

    loadNewOp(op: DrawingOperation) {
        this.previousOp = this.currentOp;
        this.currentOp = op; 
        if (
            this.previousOp !== null
            && this.previousOp.char === this.currentOp.char
            && this.previousOp.color.equals(this.currentOp.color)
            && this.previousOp.pos.equals(this.currentOp.pos)
            && this.previousOp.background.equals(this.currentOp.background)
            && this.previousOp.isVisible === this.currentOp.isVisible) {
            this.noChange = true; 
        }
        else {
            this.noChange = false; 
        }
    }

    getErasePrevOp(): CanvasOperation {
        if (this.previousOp === null || !this.previousOp.isVisible || this.noChange) {
            return null; 
        }
        
        const factory: CanvasOperationFactory = new CanvasOperationFactory(this.previousOp.pos); 
        const transparent: Color = Color.Transparent(); 

        if (this.previousOp.pos.equals(this.currentOp.pos)) {
            // Two operations are in the same grid
            if (this.previousOp.background.equals(this.currentOp.background) && this.currentOp.background.a === 1) {
                // Two operations has the same backgroud
                if (this.previousOp.char !== this.currentOp.char) {
                    factory.drawChar(this.previousOp.char, this.previousOp.background);
                }
                // The only difference being the color
                
            }
            else {
                factory.drawBackground(transparent); 
            }
            
        }
        else {
            factory.drawBackground(transparent); 
        }
        
        return factory.build(); 
    }
    getPrintCurrentOp(): CanvasOperation {
        if (this.currentOp === null || this.noChange) {
            return null; 
        }
        const factory = new CanvasOperationFactory(this.currentOp.pos); 
        // const needToRedrawBackground: boolean = 
        //         this.previousOp === null
        //     || !(this.currentOp.pos.equals(this.previousOp.pos)
        //     && this.currentOp.char === this.previousOp.char
        //     && this.currentOp.background.equals(this.previousOp.background));

        // if (needToRedrawBackground) {
        //     factory.drawBackground(this.currentOp.background); 
        // }
        factory.drawBackground(this.currentOp.background); 
        factory.drawChar(this.currentOp.char, this.currentOp.color); 

        return factory.build(); 
    }
}