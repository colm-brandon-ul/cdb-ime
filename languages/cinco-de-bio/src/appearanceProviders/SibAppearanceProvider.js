"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SibAppearanceProvider = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class SibAppearanceProvider extends cinco_glsp_api_1.AppearanceProvider {
    getAppearance(action, ...args) {
        // parse action
        const modelElementId = action.modelElementId;
        const element = this.getElement(modelElementId);
        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';
        this.log(message);
        return [];
        // return [appearanceUpdate];
    }
}
exports.SibAppearanceProvider = SibAppearanceProvider;
// register into app
cinco_glsp_api_1.LanguageFilesRegistry.register(SibAppearanceProvider);
