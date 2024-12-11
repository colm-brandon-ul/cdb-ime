import { Container, Node, GraphModel, LanguageFilesRegistry, ValidationHandler } from '@cinco-glsp/cinco-glsp-api';
import { Action, ValidationResponseAction, ValidationRequestAction, ValidationStatus, ValidationMessage } from '@cinco-glsp/cinco-glsp-common';
import { set } from 'lodash';

export class SibCheck extends ValidationHandler {
    override CHANNEL_NAME: string | undefined = 'Workflow [' + this.modelState.graphModel.id + ']';

    override execute(action: ValidationRequestAction, ...args: unknown[]): Promise<Action[]> | Action[] {
        // next actions

        const modelElement = this.getElement(action.modelElementId);
        const name = `${modelElement.getSpec().label} (${modelElement.id})`

        const workflow = modelElement as GraphModel;

        const sibs = workflow.containedElements
            .filter(element => (element.type == "cincodebio:automatedsib" || element.type == "cincodebio:interactivesib"));
        

        var responses: ValidationResponseAction[] = []
        var label_messages: ValidationMessage[] = []
        const ok: ValidationMessage = {
            name: `Workflow : (${workflow.id})`,
            message: 'OK',
            status: ValidationStatus.Pass
        }
    
        if (sibs.length == 0){
            return responses
        }
        
        sibs.forEach((sib) => {
            const csib = sib as Container;
            const rcsib = sib.primeReference as Container
            // prime reference no longer exist
            if (sib.primeReference === undefined){
                label_messages.push({
                    name: `SIB: ${sib.getProperty("label")} (${sib.id})`,
                    message: `No longer exists in the SIB library. Please delete.`,
                    status: ValidationStatus.Error
                })
            }
            else{

            const input_ports = csib.containments.filter((a) => a.type === 'cincodebio:inputport')
            label_messages.push(...this.validatePrime(csib,rcsib))
                input_ports.forEach((ip) => {
                    if (ip.incomingEdges.length !== 1){
                        label_messages.push({
                            name: `SIB: ${sib.getProperty("label")} (${sib.id})`,
                            message: `Missing dataflow edge for ${ip.getProperty('name')} : ${ip.getProperty('typeName')}`,
                            status: ValidationStatus.Error
                        })
                    }

                })
            }


        })

        if (label_messages.length > 0){
            responses.push(ValidationResponseAction.create(
                this.modelState.graphModel.id,
                'sib-check',
                label_messages,
                action.requestId
            ))
        }
        else{
            responses.push(ValidationResponseAction.create(
                this.modelState.graphModel.id,
                'sib-check',
                [ok],
                action.requestId
            ))
        }

        return responses;
    }

    override canExecute(action: ValidationRequestAction, ...args: unknown[]): Promise<boolean> | boolean {
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
    validatePrime(node: Container, ref: Container): ValidationMessage[]{
        var messages: ValidationMessage[] = []
        const nodeChildren = node.containments
        const refChildren = ref.containments
        const nodeBranches = node.getProperty('validBranches')
        const refBranches = refChildren.filter(a => a.type === 'siblibrary:branch').map(a => a.getProperty('name') as string)
        
        const nodeLabel = `${node.getProperty('name')} ${node.getProperty('label')}`
        const refLabel = `${ref.getProperty('name')} ${ref.getProperty('label')}`



        if (!areSetsEqual(new Set(nodeBranches), new Set(refBranches))){
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Control Flow Branches have changed. Current: [${nodeBranches.join(', ')}] - Actual: [${refBranches.join(', ')}]. Please Refresh SIB. `,
                status: ValidationStatus.Error
            })
        }
        
        if (nodeLabel !== refLabel){
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `SIB name has changed to ${refLabel}. Please Refresh SIB.`,
                status: ValidationStatus.Error
            })
        }
        
        const nip: string[] = nodeChildren
            .filter(a => a.type === 'cincodebio:inputport')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}` as string);
        
        const rip: string[] = refChildren
            .filter(a => a.type === 'siblibrary:input')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}` as string);

        const nop: string[] = nodeChildren
            .filter(a => a.type === 'cincodebio:outputport')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}` as string);

        const rop: string[] = refChildren
            .filter(a => a.type === 'siblibrary:output')
            .map(a => `${a.getProperty('name')} ${a.getProperty('typeName')}` as string);

        // Output ports
        // in wflow but not in prime
        const o1 = Array.from(new Set(difference(new Set(nop),new Set(rop))))
        // in prime but not in wflow
        const o2 = Array.from(new Set(difference(new Set(rop),new Set(nop))))

        if (o1.length != 0){
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${o1.join(', ')} no longer exist. Please Refresh SIB.`,
                status: ValidationStatus.Error
            })
        }

        if (o2.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${o2.join(', ')} are missing. Please Refresh SIB.`,
                status: ValidationStatus.Error
            })
        }


        // Input ports
        // in wflow but not in prime
        const i1 = Array.from(new Set(difference(new Set(nip),new Set(rip))))
        // in prime but not in wflow
        const i2 = Array.from(new Set(difference(new Set(rip),new Set(nip))))

        if (i1.length != 0){
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Input Ports - ${i1.join(', ')} no longer exist. Please Refresh SIB.`,
                status: ValidationStatus.Error
            })
        }

        if (i2.length != 0) {
            messages.push({
                name: `SIB: ${node.getProperty("label")} (${node.id})`,
                message: `Output Ports - ${i2.join(', ')} are missing. Please Refresh SIB.`,
                status: ValidationStatus.Error
            })
        }
       

        

        return messages
    
    }
}

export function difference<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    return new Set([...setA].filter(x => !setB.has(x)));
}

export function areSetsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
    return set1.size === set2.size && 
           [...set1].every(element => set2.has(element));
  }

// register into app
LanguageFilesRegistry.register(SibCheck);

