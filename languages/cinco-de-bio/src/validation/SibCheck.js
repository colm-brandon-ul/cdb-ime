"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areSetsEqual = exports.difference = exports.SibCheck = void 0;
const cinco_glsp_api_1 = require("@cinco-glsp/cinco-glsp-api");
const cinco_glsp_common_1 = require("@cinco-glsp/cinco-glsp-common");
class SibCheck extends cinco_glsp_api_1.ValidationHandler {
    constructor() {
        super(...arguments);
        this.CHANNEL_NAME = 'Workflow [' + this.modelState.graphModel.id + ']';
    }
    execute(action, ...args) {
        // next actions
        const modelElement = this.getElement(action.modelElementId);
        const name = `${modelElement.getSpec().label} (${modelElement.id})`;
        const workflow = modelElement;
        const sibs = workflow.containedElements
            .filter(element => (element.type == "cincodebio:automatedsib" || element.type == "cincodebio:interactivesib"));
        var responses = [];
        var label_messages = [];
        const ok = {
            name: `Workflow : (${workflow.id})`,
            message: 'OK',
            status: cinco_glsp_common_1.ValidationStatus.Pass
        };
        if (sibs.length == 0) {
            return responses;
        }
        sibs.forEach((sib) => {
            const csib = sib;
            const rcsib = sib.primeReference;
            // prime reference no longer exist
            if (sib.primeReference === undefined) {
                label_messages.push({
                    name: `SIB: ${sib.getProperty("label")} (${sib.id})`,
                    message: `No longer exists in the SIB library. Please delete.`,
                    status: cinco_glsp_common_1.ValidationStatus.Error
                });
            }
            else {
                const input_ports = csib.containments.filter((a) => a.type === 'cincodebio:inputport');
                label_messages.push(...this.validatePrime(csib, rcsib));
                input_ports.forEach((ip) => {
                    if (ip.incomingEdges.length !== 1) {
                        label_messages.push({
                            name: `SIB: ${sib.getProperty("label")} (${sib.id})`,
                            message: `Missing dataflow edge for ${ip.getProperty('name')} : ${ip.getProperty('typeName')}`,
                            status: cinco_glsp_common_1.ValidationStatus.Error
                        });
                    }
                });
            }
        });
        if (label_messages.length > 0) {
            responses.push(cinco_glsp_common_1.ValidationResponseAction.create(this.modelState.graphModel.id, 'sib-check', label_messages, action.requestId));
        }
        else {
            responses.push(cinco_glsp_common_1.ValidationResponseAction.create(this.modelState.graphModel.id, 'sib-check', [ok], action.requestId));
        }
        return responses;
    }
    canExecute(action, ...args) {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }
    /**
     * Checks to see if all the input ports, output ports, labels & branches are indentical between the workflow SIB
     * and the reference SIB.
     * @param {Container} node - The SIB from the worflow (cincodebio)
     * @param {Container} ref - The PrimeReference SIB (siblibrary) the workflow SIB (cincodebio) is referencing.
     * @returns {ValidationMessage[]}
     */
    validatePrime(node, ref) {
        var messages = [];
        const nodeChildren = node.containments;
        const refChildren = ref.containments;
        const nodeBranches = node.getProperty('validBranches');
        const refBranches = refChildren.filter(a => a.type === 'siblibrary:branch').map(a => a.getProperty('name'));
        const nodeLabel = `${node.getProperty('name')} ${node.getProperty('label')}`;
        const refLabel = `${ref.getProperty('name')} ${ref.getProperty('label')}`;
        if (!areSetsEqual(new Set(nodeBranches), new Set(refBranches))) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Control Flow Branches have changed. Current: [${nodeBranches.join(', ')}] - Actual: [${refBranches.join(', ')}]. Please Refresh SIB. `,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        if (nodeLabel !== refLabel) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `SIB name has changed to ${refLabel}. Please Refresh SIB.`,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        const nip = nodeChildren
            .filter(a => a.type === 'cincodebio:inputport')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}`);
        const rip = refChildren
            .filter(a => a.type === 'siblibrary:input')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}`);
        const nop = nodeChildren
            .filter(a => a.type === 'cincodebio:outputport')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}`);
        const rop = refChildren
            .filter(a => a.type === 'siblibrary:output')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}`);
        // Output ports
        // in wflow but not in prime
        const o1 = Array.from(new Set(difference(new Set(nop), new Set(rop))));
        // in prime but not in wflow
        const o2 = Array.from(new Set(difference(new Set(rop), new Set(nop))));
        if (o1.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${o1.join(', ')} no longer exist. Please Refresh SIB.`,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        if (o2.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${o2.join(', ')} are missing. Please Refresh SIB.`,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        // Input ports
        // in wflow but not in prime
        const i1 = Array.from(new Set(difference(new Set(nip), new Set(rip))));
        // in prime but not in wflow
        const i2 = Array.from(new Set(difference(new Set(rip), new Set(nip))));
        if (i1.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Input Ports - ${i1.join(', ')} no longer exist. Please Refresh SIB.`,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        if (i2.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${i2.join(', ')} are missing. Please Refresh SIB.`,
                status: cinco_glsp_common_1.ValidationStatus.Error
            });
        }
        return messages;
    }
}
exports.SibCheck = SibCheck;
function difference(setA, setB) {
    return new Set([...setA].filter(x => !setB.has(x)));
}
exports.difference = difference;
function areSetsEqual(set1, set2) {
    return set1.size === set2.size &&
        [...set1].every(element => set2.has(element));
}
exports.areSetsEqual = areSetsEqual;
// register into app
cinco_glsp_api_1.LanguageFilesRegistry.register(SibCheck);
