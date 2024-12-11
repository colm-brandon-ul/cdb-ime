"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFlowCheck = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
const cinco_glsp_common_1 = require("@cinco-glsp/cinco-glsp-common");
class DataFlowCheck extends cinco_glsp_api_1.ValidationHandler {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'Workflow [' + this.modelState.graphModel.id + ']';
    }
    execute(action, ...args) {
        // next actions
        const modelElement = this.getElement(action.modelElementId);
        const name = `${modelElement.getSpec().label} (${modelElement.id})`;
        const workflow = modelElement;
        var responses = [];
        var label_messages = [];
        const ok = {
            name: `Workflow : (${workflow.id})`,
            message: 'OK',
            status: cinco_glsp_common_1.ValidationStatus.Pass
        };
        // sibs ->
        const sibs = workflow.containedElements
            .filter(element => (element.type == "cincodebio:automatedsib" || element.type == "cincodebio:interactivesib"));
        sibs.forEach((sib) => {
            const csib = sib;
            var ips = csib.containments.filter((a) => a.type === 'cincodebio:inputport');
            this.log('PATHS ' + csib.id);
            // const paths : string[][]= getAllPaths(csib)
            const rev_paths = getAllPaths(csib, true);
            this.log(JSON.stringify(rev_paths));
            ips.forEach((ip) => {
                ip.incomingEdges.forEach((edge) => {
                    const op = this.getElement(edge.sourceID.toString());
                    const opt = op.getProperty('typeName');
                    const ipt = ip.getProperty('typeName');
                    // check for type mismatch
                    if (opt !== ipt) {
                        const osib = op.parent;
                        label_messages.push({
                            name: `SIB : (${sib.id})`,
                            message: `Type Mismatch on ${sib.getProperty('label')}. Input of ${opt} from ${osib.getProperty('label')} is invalid. Valid input ${ipt}`,
                            status: cinco_glsp_common_1.ValidationStatus.Error
                        });
                    }
                    // check if input is from a SIB later in the control flow graph
                    if (!rev_paths.some((path) => path.some((value) => value.includes(op.parent.id)))) {
                        const osib = op.parent;
                        label_messages.push({
                            name: `SIB : (${sib.id})`,
                            message: `Input of ${opt} from ${osib.getProperty('label')} is invalid, as ${osib.getProperty('label')} does not occur before or is on another branch to ${csib.getProperty('label')} in the Workflow`,
                            status: cinco_glsp_common_1.ValidationStatus.Error
                        });
                    }
                });
            });
        });
        // need to go through each input port for each sib and make sure it has an incoming edge
        // if it doesn't then that's an error
        // if it does, need to check for type mismatch
        if (label_messages.length > 0) {
            responses.push(cinco_glsp_common_1.ValidationResponseAction.create(this.modelState.graphModel.id, 'data-flow-check', label_messages, action.requestId));
        }
        else {
            responses.push(cinco_glsp_common_1.ValidationResponseAction.create(this.modelState.graphModel.id, 'data-flow-check', [ok], action.requestId));
        }
        return responses;
    }
    canExecute(action, ...args) {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }
}
exports.DataFlowCheck = DataFlowCheck;
function getAllPaths(egoNode, pre = false) {
    const paths = [];
    function dfs(node, currentPath) {
        const newPath = [...currentPath, node.id];
        const outNodes = !pre ? node.successors : node.predecessors;
        if (outNodes.length === 0 || currentPath.includes(node.id)) {
            paths.push(newPath);
            return;
        }
        for (const successor of outNodes) {
            dfs(successor, newPath);
        }
    }
    const outNodes = !pre ? egoNode.successors : egoNode.predecessors;
    for (const suc of outNodes) {
        dfs(suc, [egoNode.id]);
    }
    return paths;
}
// register into app
cinco_glsp_api_1.LanguageFilesRegistry.register(DataFlowCheck);
