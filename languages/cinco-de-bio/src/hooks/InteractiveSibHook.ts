import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds } from '@cinco-glsp/cinco-glsp-api';
import { MetaSpecification, getGraphSpecOf } from '@cinco-glsp/cinco-glsp-common';
import { Point } from 'sprotty-protocol';

export const HEADER_HEIGHT: number = 20;
export const FOOTER_HEIGHT: number = 20;
export const IO_HEIGHT: number = 20;
export const LABEL_HEIGHT: number = 50
export const PADDING: number = 5

const map = {
    "cincodebio:inputport":IO_HEIGHT,
    "cincodebio:siblabel": LABEL_HEIGHT,
    "cincodebio:outputport": IO_HEIGHT
}


export class InteractiveSibHook extends AbstractNodeHook {
    override CHANNEL_NAME: string | undefined = 'InteractiveSibHook [' + this.modelState.root.id + ']';

   
    override postCreate(node: Node): void {
        if(node.isPrime) {
            const image = node as Container
            const reference = node.primeReference! as Container
            const referenceInfo = node.primeReferenceInfo!;
            var valid_branches: any[] = []
            image.size = reference.size

            node.setProperty('name',reference.getProperty('name'))
            node.setProperty('label',reference.getProperty('label'))
            node.setProperty('documentation',reference.getProperty('documentation'))

            
            reference.containments.forEach((child: Node) => {

                if (child.type == 'siblibrary:input'){

                    let n = new Node()
                    n.type = "cincodebio:inputport";
                    n.initializeProperties()
                    n.position = { x : child.position.x, y : child.position.y }
                    n.size =  { width: node.size.width, height: child.size.height }
                    n['_attributes'] = child['_attributes']
                    image.containments.push(n)
                    
                    

                }

                if (child.type == 'siblibrary:output') {
                    let n = new Node()
                    n.type = "cincodebio:outputport";
                    n.initializeProperties()
                    n.position = { x : child.position.x, y : child.position.y }
                    n.size =  { width: node.size.width, height: child.size.height }
                    n['_attributes'] = child['_attributes']
                    image.containments.push(n)

                } 

                if (child.type == 'siblibrary:label') {
                    let n = new Node()
                    n.type = "cincodebio:siblabel";
                    n.initializeProperties()
                    n.position = { x : child.position.x, y : child.position.y }
                    n.size =  { width: node.size.width, height: child.size.height }
                    n['_attributes'] = child['_attributes']
                    image.containments.push(n)

                }

                if (child.type == 'siblibrary:branch'){
                    valid_branches.push(child.getProperty('name'))
                }
            });

            image.setProperty('validBranches', valid_branches)
               
           layout(image) 
        }
    }

    override postMove(node: Node, oldPosition?: Point | undefined): void {
        
    }

    override postResize(node: Node, resizeBounds: ResizeBounds): void {
        layout(node as Container);
    }
}

export function layout(sib : Container, ignore? : Node) {
        
    const width = sib.size.width;

    // Sort alphabetically by type, then numerically by y
    const nodes = sib.containments.sort((a, b) => {
        const result = a.type.replace('sib','').localeCompare(b.type.replace('sib',''));
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
            width: node.type === "cincodebio:siblabel" ? width : width,
            height: map[node.type]
        }

        // and put into correct position
        node.position = {
            x : node.type === "cincodebio:siblabel" ? width * 0 : 0,
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


LanguageFilesRegistry.register(InteractiveSibHook);
