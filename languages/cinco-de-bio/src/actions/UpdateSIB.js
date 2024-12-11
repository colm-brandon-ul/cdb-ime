"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arraysHaveSameElements = exports.layout = exports.UpdateSIB = exports.PADDING = exports.LABEL_HEIGHT = exports.IO_HEIGHT = exports.FOOTER_HEIGHT = exports.HEADER_HEIGHT = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
const server_1 = require("@eclipse-glsp/server");
exports.HEADER_HEIGHT = 20;
exports.FOOTER_HEIGHT = 20;
exports.IO_HEIGHT = 20;
exports.LABEL_HEIGHT = 50;
exports.PADDING = 5;
const map = {
    "cincodebio:inputport": exports.IO_HEIGHT,
    "cincodebio:siblabel": exports.LABEL_HEIGHT,
    "cincodebio:outputport": exports.IO_HEIGHT
};
const typeMap = new Map();
const obj = {
    "siblibrary:service": "cincodebio:automatedsib",
    "siblibrary:task": "cincodebio:interactivesib",
    'siblibrary:input': "cincodebio:inputport",
    'siblibrary:output': "cincodebio:outputport",
    'siblibrary:label': 'cincodebio:siblabel'
};
Object.entries(obj).forEach(([k, v]) => {
    typeMap.set(k, v);
    typeMap.set(v, k);
});
class UpdateSIB extends cinco_glsp_api_1.CustomActionHandler {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'UpdateSIB [' + this.modelState.root.id + ']';
    }
    execute(action, ...args) {
        const csib = this.modelState.index.findNode(action.modelElementId);
        const reference = csib.primeReference;
        const referenceInfo = csib.primeReferenceInfo;
        const noBranches = reference.containments.filter((a) => typeMap.has(a.type));
        const branches = reference.containments.filter((a) => !typeMap.has(a.type)).map(a => a.getProperty('name'));
        var actions = [];
        if (csib.getProperty('validBranches') === undefined) {
            if (branches.length > 0) {
                this.log('I HAVE BRANCHES');
                this.log(branches.join(' ,'));
                this.log(`${csib.getProperty('validBranches')}`);
                csib.setProperty('validBranches', branches);
            }
        }
        else if (!arraysHaveSameElements(csib.getProperty('validBranches'), branches)) {
            csib.setProperty('validBranches', branches);
        }
        var cache = new Map();
        // Overwrite attributes
        Object.keys(csib.properties).forEach(k => {
            if (reference.getProperty(k) !== undefined && csib.getProperty(k) !== reference.getProperty(k)) {
                csib.setProperty(k, reference.getProperty(k));
            }
        });
        var indexesToRemove = [];
        // iterate over csib and see what isn't in prime then delete them
        csib.containments.forEach((a, i) => {
            const match = noBranches.some((b) => {
                if (cache.has(b.id) && cache.has(a.id)) {
                    // add none to cache
                    return cache.get(a.id) === cache.get(b.id);
                }
                else if (cache.has(b.id)) {
                    // add a to cache
                    cache.set(a.id, JSON.stringify(a.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
                else if (cache.has(a.id)) {
                    // add b to cache
                    cache.set(b.id, JSON.stringify(b.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
                else {
                    // add both to cache
                    cache.set(a.id, JSON.stringify(a.properties));
                    cache.set(b.id, JSON.stringify(b.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
            });
            if (!match) {
                indexesToRemove.push(i);
            }
        });
        // remove nodes from csib which aren't in prime
        actions.push(server_1.DeleteElementOperation.create(csib.containments
            .filter((v, i) => indexesToRemove.includes(i))
            .map(a => a.id)));
        // then iterate over prime and see what isn't in csib and add?
        noBranches.forEach((a) => {
            var _a;
            const match = csib.containments.some((b) => {
                if (cache.has(b.id) && cache.has(a.id)) {
                    // add none to cache
                    return cache.get(a.id) === cache.get(b.id);
                }
                else if (cache.has(b.id)) {
                    // add a to cache
                    cache.set(a.id, JSON.stringify(a.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
                else if (cache.has(a.id)) {
                    // add b to cache
                    cache.set(b.id, JSON.stringify(b.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
                else {
                    // add both to cache
                    cache.set(a.id, JSON.stringify(a.properties));
                    cache.set(b.id, JSON.stringify(b.properties));
                    return cache.get(a.id) === cache.get(b.id);
                }
            });
            if (!match) {
                let n = new cinco_glsp_api_1.Node();
                // perhaps should change this to something more robust (simply don't create node?)
                n.type = (_a = typeMap.get(a.type)) !== null && _a !== void 0 ? _a : "default";
                n.initializeProperties();
                n.position = { x: a.position.x, y: a.position.y };
                n.size = { width: csib.size.width, height: a.size.height };
                n['_attributes'] = a['_attributes'];
                csib.containments.push(n);
            }
        });
        this.actionDispatcher.dispatchAll(actions);
        layout(csib);
        return [];
    }
    canExecute(action, ...args) {
        const artifact = this.modelState.index.findNode(action.modelElementId);
        return true;
    }
}
exports.UpdateSIB = UpdateSIB;
function layout(sib, ignore) {
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
    var delta = exports.HEADER_HEIGHT;
    for (let node of nodes) {
        // do not layout ignored slot
        if (node == ignore)
            continue;
        // make slot as wide as slottable
        node.size = {
            width: width,
            height: map[node.type]
        };
        // and put into correct position
        node.position = {
            x: 0,
            y: delta
        };
        delta += (map[node.type] + exports.PADDING);
    }
    delta += exports.FOOTER_HEIGHT;
    sib.size = {
        width: width,
        height: delta
    };
}
exports.layout = layout;
function arraysHaveSameElements(arr1, arr2) {
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
exports.arraysHaveSameElements = arraysHaveSameElements;
cinco_glsp_api_1.LanguageFilesRegistry.register(UpdateSIB);
