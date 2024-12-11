"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFlowHook = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class DataFlowHook extends cinco_glsp_api_1.AbstractEdgeHook {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'DataFlowHook [' + this.modelState.root.id + ']';
    }
    postCreate(edge) {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
    }
}
exports.DataFlowHook = DataFlowHook;
cinco_glsp_api_1.LanguageFilesRegistry.register(DataFlowHook);
