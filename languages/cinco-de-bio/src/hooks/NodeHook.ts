import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds } from '@cinco-glsp/cinco-glsp-api';
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


export class NodeHook extends AbstractNodeHook {
    override CHANNEL_NAME: string | undefined = 'NodeHook [' + this.modelState.root.id + ']';

   
    override postCreate(node: Node): void {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
        if (node.type === "siblibrary:branch") {
            node.setProperty('name', getRandomWord())
        }

        if (node.type === "siblibrary:input" || node.type === "siblibrary:output" ) {
            node.setProperty('name', getRandomWord().toLowerCase())
            node.setProperty('typeName',  getRandomWord().toUpperCase())
        }
        
        layout(node.parent as Container)
    }

    override postMove(node: Node, oldPosition?: Point | undefined): void {
        layout(node.parent as Container);
    }

    override postResize(node: Node, resizeBounds: ResizeBounds): void {
        layout(node.parent as Container);
    }

    override postDelete(node: Node): void {
        layout(node.parent as Container);
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
    'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew',
    'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'peach', 'quince', 'raspberry',
    'strawberry', 'tangerine', 'watermelon', 'zucchini'
  ];
  
export function getRandomWord(): string {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}


LanguageFilesRegistry.register(NodeHook);
