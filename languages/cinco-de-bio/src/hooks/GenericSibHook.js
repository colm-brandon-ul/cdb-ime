"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericSibHook = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class GenericSibHook extends cinco_glsp_api_1.DoubleClickHandler {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'HooksAndActions [' + this.modelState.graphModel.id + ']';
    }
    execute(action, ...args) {
        // parse action
        const modelElementId = action.modelElementId;
        const element = this.modelState.index.findElement(modelElementId);
        this.dialog(`${element.getProperty('label')} Documentation`, element.getProperty('documentation'));
        // logging
        const message = 'Element [' + element.type + '] was double-clicked with id: ' + element.id;
        // next actions => find all activities and update their appearance
        // const consecutiveActions: Action[] = [AppearanceUpdateRequestAction.create(modelElementId)];
        return [];
    }
    canExecute(action, ...args) {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }
}
exports.GenericSibHook = GenericSibHook;
cinco_glsp_api_1.LanguageFilesRegistry.register(GenericSibHook);
