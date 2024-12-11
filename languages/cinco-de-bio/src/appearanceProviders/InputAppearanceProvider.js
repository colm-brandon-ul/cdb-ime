"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputAppearanceProvider = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class InputAppearanceProvider extends cinco_glsp_api_1.AppearanceProvider {
    getAppearance(action, ...args) {
        var _a, _b, _c;
        // parse action
        const modelElementId = action.modelElementId;
        const element = this.getElement(modelElementId);
        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';
        let labelNode = element;
        this.log('HELLO');
        this.log(JSON.stringify(labelNode.properties));
        this.log(`${labelNode.isPrime}`);
        if (labelNode.isPrime && ((_a = labelNode.primeReference) === null || _a === void 0 ? void 0 : _a.properties)) {
            this.log(JSON.stringify((_b = labelNode.primeReference) === null || _b === void 0 ? void 0 : _b.properties));
            this.log(JSON.stringify(labelNode.properties));
            labelNode.properties = (_c = labelNode.primeReference) === null || _c === void 0 ? void 0 : _c.properties;
        }
        return [];
        // return [appearanceUpdate];
    }
}
exports.InputAppearanceProvider = InputAppearanceProvider;
// register into app
cinco_glsp_api_1.LanguageFilesRegistry.register(InputAppearanceProvider);
