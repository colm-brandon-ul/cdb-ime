import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds, GraphModelWatcher, readJson } from '@cinco-glsp/cinco-glsp-api';
import { MetaSpecification, getGraphSpecOf } from '@cinco-glsp/cinco-glsp-common';
import { Point } from 'sprotty-protocol';

export const HEADER_HEIGHT: number = 20;
export const FOOTER_HEIGHT: number = 20;
export const IO_HEIGHT: number = 20;
export const LABEL_HEIGHT: number = 50
export const PADDING: number = 5

const map = {
    "siblibrary:input":IO_HEIGHT,
    "siblibrary:label": LABEL_HEIGHT,
    "siblibrary:output": IO_HEIGHT,
    "siblibrary:branch" : IO_HEIGHT
}


export class InteractiveHook extends AbstractNodeHook {
    override CHANNEL_NAME: string | undefined = 'InteractiveHook [' + this.modelState.root.id + ']';
    watching = false;

    postContentChange(model: Node): void { // TODO: Sami - add issue for onOpen Annotation and add me 
        if(!this.watching) {
            GraphModelWatcher.addCallback('hippoFlow_' + model.id, async dirtyFiles => {
                for (const dirtyFile of dirtyFiles) {
                    const model = (await readJson(dirtyFile.path, { hideError: true })) as any | undefined;
                    if (model && model.type == 'siblibrary.siblibrary') {
    
                    } else if (model && model.type == 'cincodebio.cincodebiographmodel') {
    
                    }
                }
            });
            this.watching = true;
        }
    }
    
    override postCreate(node: Node): void {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
        const name = getRandomDescriptiveWord()
        node.setProperty("name", name)
        node.setProperty("label", name.replace(/^./, name[0].toUpperCase()))

        const image = node as Container
        var delta = 0

        const input_type = getRandomTypeName()
        var input = new Node() as Node;
        input.type = "siblibrary:input";
        input.position = { x : 0, y : HEADER_HEIGHT };
        input.size =  { width: node.size.width, height: IO_HEIGHT };
        input.initializeProperties();
        input['_attributes']['name'] = input_type.toLowerCase();
        input['_attributes']['typeName'] = input_type;
        delta = (input.position.y + input.size.height + PADDING);

        var label = new Node() as Node;
        label.type = "siblibrary:label";
        label.position = { x : 0, y : delta}
        label.size =  { width: node.size.width, height: LABEL_HEIGHT };
        label.initializeProperties();
        label['_attributes']['icon'] = 'icons/task.png';
        label['_attributes']['name'] = image.getProperty('name');
        label['_attributes']['label'] = image.getProperty('label');
        delta = (label.position.y + label.size.height + PADDING);

        const output_type = getRandomTypeName()
        var output = new Node();
        output.type = "siblibrary:output";
        output.position = { x : 0, y : delta }
        output.size =  { width: node.size.width, height: IO_HEIGHT };
        output.initializeProperties();
        output['_attributes']['name'] = output_type.toLowerCase();
        output['_attributes']['typeName'] = output_type;
        delta = (output.position.y + output.size.height + PADDING);

        image.containments.push(input,output,label);
        image.size.height = (delta + FOOTER_HEIGHT)
    
        
    }

    override postMove(node: Node, oldPosition?: Point | undefined): void {
        
    }

    override postResize(node: Node, resizeBounds: ResizeBounds): void {
        layout(node as Container);
    }
}

export function layout(sib : Container, ignore? : Node) {
        
    const width = sib.size.width;

    // const nodes = sib.containments.sort((a, b) => a.position.y - b.position.y);
    // parition into inputs, outputs and labels

    // Sort alphabetically by type, then numerically by y
    const nodes = sib.containments.sort((a, b) => {
        const result = a.type.localeCompare(b.type);
        if (result !== 0) {
        return result; 
        }
        return a.position.y - b.position.y;
    });

    var delta = HEADER_HEIGHT

    for (let node of nodes) {
        // do not layout ignored slot
        if (node == ignore)
            continue;
        
        // make slot as wide as slottable
        node.size = {
            width: width,
            height: map[node.type]
        }

        // and put into correct position
        node.position = {
            x : 0,
            y : delta
        }

        delta += (map[node.type] + PADDING)
    }

    delta += FOOTER_HEIGHT

    sib.size = {
        width : width,
        height: delta
    }
}

const wordList = [
    'crop', 'resize', 'rotate', 'blur', 'sharpen', 'filter', 'transform', 'overlay',
    'compose', 'extract', 'mask', 'colorize', 'grayscale', 'invert', 'adjust', 'enhance',
    'optimize', 'compress', 'convert', 'batch', 'automate', 'process', 'analyze', 'detect',
    'recognize', 'classify', 'segment', 'track', 'measure', 'monitor', 'visualize',
    'generate', 'synthesize', 'manipulate', 'simulate', 'emulate', 'integrate', 'automate'
  ];
  
  export function getRandomDescriptiveWord(): string {
    return wordList[Math.floor(Math.random() * wordList.length)];
  }

  const prefixes = [
    'I', 'T', 'C', 'A', 'E', 'S', 'P', 'M', 'D', 'N', 'B', 'F', 'H', 'J', 'L', 'R', 'V', 'X', 'Z'
  ];
  
  const suffixes = [
    'Manager', 'Service', 'Handler', 'Builder', 'Factory', 'Processor', 'Analyzer',
    'Adapter', 'Resolver', 'Provider', 'Transformer', 'Validator', 'Renderer', 'Engine'
  ];
  
  export function getRandomTypeName(): string {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}`;
  }


LanguageFilesRegistry.register(InteractiveHook);
