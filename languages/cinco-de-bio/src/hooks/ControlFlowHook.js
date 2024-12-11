"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlFlowHook = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class ControlFlowHook extends cinco_glsp_api_1.AbstractEdgeHook {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'ControlFlowHook [' + this.modelState.root.id + ']';
    }
    postCreate(edge) {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
        const sourceSib = edge.source;
        const targetSib = edge.target;
        const sourcePrime = sourceSib.primeReference;
        const names = sourcePrime.containments.filter((a) => a.type === 'siblibrary:branch');
        if (names.length != 0) {
            edge.setProperty('label', names[0].getProperty('name'));
        }
    }
}
exports.ControlFlowHook = ControlFlowHook;
cinco_glsp_api_1.LanguageFilesRegistry.register(ControlFlowHook);
