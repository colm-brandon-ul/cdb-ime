"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomTypeName = exports.getRandomDescriptiveWord = exports.layout = exports.InteractiveHook = exports.PADDING = exports.LABEL_HEIGHT = exports.IO_HEIGHT = exports.FOOTER_HEIGHT = exports.HEADER_HEIGHT = void 0;
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
class InteractiveHook extends cinco_glsp_api_1.AbstractNodeHook {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'InteractiveHook [' + this.modelState.root.id + ']';
        this.watching = false;
    }
    postContentChange(model) {
        if (!this.watching) {
            cinco_glsp_api_1.GraphModelWatcher.addCallback('hippoFlow_' + model.id, (dirtyFiles) => __awaiter(this, void 0, void 0, function* () {
                for (const dirtyFile of dirtyFiles) {
                    const model = (yield (0, cinco_glsp_api_1.readJson)(dirtyFile.path, { hideError: true }));
                    if (model && model.type == 'siblibrary.siblibrary') {
                    }
                    else if (model && model.type == 'cincodebio.cincodebiographmodel') {
                    }
                }
            }));
            this.watching = true;
        }
    }
    postCreate(node) {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
        const name = getRandomDescriptiveWord();
        node.setProperty("name", name);
        node.setProperty("label", name.replace(/^./, name[0].toUpperCase()));
        const image = node;
        var delta = 0;
        const input_type = getRandomTypeName();
        var input = new cinco_glsp_api_1.Node();
        input.type = "siblibrary:input";
        input.position = { x: 0, y: exports.HEADER_HEIGHT };
        input.size = { width: node.size.width, height: exports.IO_HEIGHT };
        input.initializeProperties();
        input['_attributes']['name'] = input_type.toLowerCase();
        input['_attributes']['typeName'] = input_type;
        delta = (input.position.y + input.size.height + exports.PADDING);
        var label = new cinco_glsp_api_1.Node();
        label.type = "siblibrary:label";
        label.position = { x: 0, y: delta };
        label.size = { width: node.size.width, height: exports.LABEL_HEIGHT };
        label.initializeProperties();
        label['_attributes']['icon'] = 'icons/task.png';
        label['_attributes']['name'] = image.getProperty('name');
        label['_attributes']['label'] = image.getProperty('label');
        delta = (label.position.y + label.size.height + exports.PADDING);
        const output_type = getRandomTypeName();
        var output = new cinco_glsp_api_1.Node();
        output.type = "siblibrary:output";
        output.position = { x: 0, y: delta };
        output.size = { width: node.size.width, height: exports.IO_HEIGHT };
        output.initializeProperties();
        output['_attributes']['name'] = output_type.toLowerCase();
        output['_attributes']['typeName'] = output_type;
        delta = (output.position.y + output.size.height + exports.PADDING);
        image.containments.push(input, output, label);
        image.size.height = (delta + exports.FOOTER_HEIGHT);
    }
    postMove(node, oldPosition) {
    }
    postResize(node, resizeBounds) {
        layout(node);
    }
}
exports.InteractiveHook = InteractiveHook;
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
    'crop', 'resize', 'rotate', 'blur', 'sharpen', 'filter', 'transform', 'overlay',
    'compose', 'extract', 'mask', 'colorize', 'grayscale', 'invert', 'adjust', 'enhance',
    'optimize', 'compress', 'convert', 'batch', 'automate', 'process', 'analyze', 'detect',
    'recognize', 'classify', 'segment', 'track', 'measure', 'monitor', 'visualize',
    'generate', 'synthesize', 'manipulate', 'simulate', 'emulate', 'integrate', 'automate'
];
function getRandomDescriptiveWord() {
    return wordList[Math.floor(Math.random() * wordList.length)];
}
exports.getRandomDescriptiveWord = getRandomDescriptiveWord;
const prefixes = [
    'I', 'T', 'C', 'A', 'E', 'S', 'P', 'M', 'D', 'N', 'B', 'F', 'H', 'J', 'L', 'R', 'V', 'X', 'Z'
];
const suffixes = [
    'Manager', 'Service', 'Handler', 'Builder', 'Factory', 'Processor', 'Analyzer',
    'Adapter', 'Resolver', 'Provider', 'Transformer', 'Validator', 'Renderer', 'Engine'
];
function getRandomTypeName() {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}`;
}
exports.getRandomTypeName = getRandomTypeName;
cinco_glsp_api_1.LanguageFilesRegistry.register(InteractiveHook);
