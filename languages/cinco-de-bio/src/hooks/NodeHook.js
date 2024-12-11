"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomWord = exports.layout = exports.NodeHook = exports.PADDING = exports.LABEL_HEIGHT = exports.IO_HEIGHT = exports.FOOTER_HEIGHT = exports.HEADER_HEIGHT = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
exports.HEADER_HEIGHT = 20;
exports.FOOTER_HEIGHT = 20;
exports.IO_HEIGHT = 20;
exports.LABEL_HEIGHT = 50;
exports.PADDING = 5;
const map = {
    "siblibrary:input": exports.IO_HEIGHT,
    "siblibrary:label": exports.LABEL_HEIGHT,
    "siblibrary:output": exports.IO_HEIGHT,
    "siblibrary:branch": exports.IO_HEIGHT
};
class NodeHook extends cinco_glsp_api_1.AbstractNodeHook {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'NodeHook [' + this.modelState.root.id + ']';
    }
    postCreate(node) {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
        if (node.type === "siblibrary:branch") {
            node.setProperty('name', getRandomWord());
        }
        if (node.type === "siblibrary:input" || node.type === "siblibrary:output") {
            node.setProperty('name', getRandomWord().toLowerCase());
            node.setProperty('typeName', getRandomWord().toUpperCase());
        }
        layout(node.parent);
    }
    postMove(node, oldPosition) {
        layout(node.parent);
    }
    postResize(node, resizeBounds) {
        layout(node.parent);
    }
    postDelete(node) {
        layout(node.parent);
    }
}
exports.NodeHook = NodeHook;
function layout(sib, ignore) {
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
const wordList = [
    'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew',
    'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'peach', 'quince', 'raspberry',
    'strawberry', 'tangerine', 'watermelon', 'zucchini'
];
function getRandomWord() {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    return wordList[randomIndex];
}
exports.getRandomWord = getRandomWord;
cinco_glsp_api_1.LanguageFilesRegistry.register(NodeHook);
