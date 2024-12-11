import { Container, CustomActionHandler, LanguageFilesRegistry, Node } from '@cinco-glsp/cinco-glsp-api';
import { Action, CustomAction } from '@cinco-glsp/cinco-glsp-common';
import { CreateNodeOperation, DeleteElementOperation} from '@eclipse-glsp/server';

export const HEADER_HEIGHT: number = 20;
export const FOOTER_HEIGHT: number = 20;
export const IO_HEIGHT: number = 20;
export const LABEL_HEIGHT: number = 50
export const PADDING: number = 5

const map = {
    "cincodebio:inputport": IO_HEIGHT,
    "cincodebio:siblabel": LABEL_HEIGHT,
    "cincodebio:outputport": IO_HEIGHT
}

const typeMap = new Map<string, string>()
const obj = {
    "siblibrary:service": "cincodebio:automatedsib",
    "siblibrary:task": "cincodebio:interactivesib",
    'siblibrary:input': "cincodebio:inputport",
    'siblibrary:output': "cincodebio:outputport",
    'siblibrary:label': 'cincodebio:siblabel'
}

Object.entries(obj).forEach(([k, v]) => {
    typeMap.set(k, v)
    typeMap.set(v, k)
})

export class UpdateSIB extends CustomActionHandler {
    override CHANNEL_NAME: string | undefined = 'UpdateSIB [' + this.modelState.root.id + ']';
    
    override execute(action: CustomAction, ...args: any): Promise<Action[]> | Action[] {
        const csib = this.modelState.index.findNode(action.modelElementId) as Container
        const reference = csib.primeReference! as Container
        const referenceInfo = csib.primeReferenceInfo!;
        const noBranches = reference.containments.filter((a) => typeMap.has(a.type))
        const branches = reference.containments.filter((a) => !typeMap.has(a.type)).map(a => a.getProperty('name'))
        

        var actions: Action[] = []

        if (csib.getProperty('validBranches') === undefined){
            if (branches.length > 0){
                this.log('I HAVE BRANCHES')
                this.log(branches.join(' ,'))
                this.log(`${csib.getProperty('validBranches')}`)
                csib.setProperty('validBranches', branches)
            }
        }
        else if (!arraysHaveSameElements(csib.getProperty('validBranches'), branches)){
            csib.setProperty('validBranches', branches)
        }

        var cache = new Map<string, string>()

        // Overwrite attributes
        Object.keys(csib.properties).forEach(k=>{
            if (reference.getProperty(k) !== undefined && csib.getProperty(k) !== reference.getProperty(k)){
                csib.setProperty(k, reference.getProperty(k))
            }
        })

        var indexesToRemove: number[] = []
        // iterate over csib and see what isn't in prime then delete them
        csib.containments.forEach((a, i) => {
            const match = noBranches.some((b) => {
                if (cache.has(b.id) && cache.has(a.id)) {
                    // add none to cache
                    return cache.get(a.id) === cache.get(b.id)
                }
                else if (cache.has(b.id)) {
                    // add a to cache
                    cache.set(a.id, JSON.stringify(a.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
                else if (cache.has(a.id)) {
                    // add b to cache
                    cache.set(b.id, JSON.stringify(b.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
                else {
                    // add both to cache
                    cache.set(a.id, JSON.stringify(a.properties))
                    cache.set(b.id, JSON.stringify(b.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
            })

            if (!match) {
                indexesToRemove.push(i)
            }
        })

        // remove nodes from csib which aren't in prime

        actions.push(DeleteElementOperation.create(
            csib.containments
            .filter((v,i) => indexesToRemove.includes(i))
            .map(a => a.id)))
        
        

        // then iterate over prime and see what isn't in csib and add?
        noBranches.forEach((a) => {
            const match = csib.containments.some((b) => {
                if (cache.has(b.id) && cache.has(a.id)) {
                    // add none to cache
                    return cache.get(a.id) === cache.get(b.id)
                }
                else if (cache.has(b.id)) {
                    // add a to cache
                    cache.set(a.id, JSON.stringify(a.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
                else if (cache.has(a.id)) {
                    // add b to cache
                    cache.set(b.id, JSON.stringify(b.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
                else {
                    // add both to cache
                    cache.set(a.id, JSON.stringify(a.properties))
                    cache.set(b.id, JSON.stringify(b.properties))
                    return cache.get(a.id) === cache.get(b.id)
                }
            })

            if (!match) {
                let n = new Node()
                // perhaps should change this to something more robust (simply don't create node?)
                n.type = typeMap.get(a.type) ?? "default";
                n.initializeProperties()
                n.position = { x: a.position.x, y: a.position.y }
                n.size = { width: csib.size.width, height: a.size.height }
                n['_attributes'] = a['_attributes']
                csib.containments.push(n)
            }

        })

        this.actionDispatcher.dispatchAll(actions)

        layout(csib)
        
        return [];
    }
    
    override canExecute(action: CustomAction, ...args: unknown[]): boolean | Promise<boolean> {
        const artifact = this.modelState.index.findNode(action.modelElementId) as Container;

        return true;
    }
}


export function layout(sib: Container, ignore?: Node) {

    const width = sib.size.width;
    

    // const nodes = sib.containments.sort((a, b) => a.position.y - b.position.y);
    // parition into inputs, outputs and labels

    // Sort alphabetically by type, then numerically by y
    const nodes = sib.containments.sort((a, b) => {
        const result = a.type.replace('sib', '').localeCompare(b.type.replace('sib', ''));
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
            x: 0,
            y: delta
        }

        delta += (map[node.type] + PADDING)
    }

    delta += FOOTER_HEIGHT

    sib.size = {
        width: width,
        height: delta
    }
}



export function arraysHaveSameElements(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  
  const set1 = new Set(arr1);
  const set2 = new Set(arr2);
  
  if (set1.size !== set2.size) {
    return false;
  }
  
  return Array.from(set1).every(element => set2.has(element));
}

LanguageFilesRegistry.register(UpdateSIB);

