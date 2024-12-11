"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAppearanceProvider = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
class TaskAppearanceProvider extends cinco_glsp_api_1.AppearanceProvider {
    getAppearance(action, ...args) {
        // parse action
        const modelElementId = action.modelElementId;
        const element = this.getElement(modelElementId);
        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';
        // Creat a label, input & output
        const shape = element.shape;
        // const propertyValue = shape.children?.find(shape => shape.name == "propertyValue") as Text;
        // 0 transparency when no incoming 1 otherwise
        // (propertyValue.appearance as Appearance).transparency = Math.max((element as Node).incomingEdges.length, 1);
        // const appearanceUpdate = ApplyAppearanceUpdateAction.create(modelElementId);
        return [];
        // return [appearanceUpdate];
    }
}
exports.TaskAppearanceProvider = TaskAppearanceProvider;
// register into app
cinco_glsp_api_1.LanguageFilesRegistry.register(TaskAppearanceProvider);
