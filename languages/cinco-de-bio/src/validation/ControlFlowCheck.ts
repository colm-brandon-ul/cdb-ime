import { Container, Node,  GraphModel, LanguageFilesRegistry, ValidationHandler } from '@cinco-glsp/cinco-glsp-api';
import { Action, ValidationResponseAction, ValidationRequestAction, ValidationStatus, ValidationMessage } from '@cinco-glsp/cinco-glsp-common';

export class ControlFlowCheck extends ValidationHandler {
    override CHANNEL_NAME: string | undefined = 'Workflow [' + this.modelState.graphModel.id + ']';

    override execute(action: ValidationRequestAction, ...args: unknown[]): Promise<Action[]> | Action[] {
        // next actions

        const modelElement = this.getElement(action.modelElementId);
        const name = `${modelElement.getSpec().label} (${modelElement.id})`

        const workflow = modelElement as GraphModel;

        const sibs = workflow.containedElements
            .filter(element => (element.type == "cincodebio:automatedsib" || element.type == "cincodebio:interactivesib"));

        var responses: ValidationResponseAction[] = []

        const no_predecessors = sibs.filter(a => a.predecessors.length == 0).map(a => a.getProperty('label'))
        
        const cycles = this.hasAnyCycle(sibs)
        var label_messages: ValidationMessage[] = this.validateBranchLabels(sibs)
        label_messages.push(
            {
                name: `Workflow: (${workflow.id})`,
                message: cycles ? 'Workflow has Cycle(s)' : 'OK',
                status: cycles ? ValidationStatus.Error : ValidationStatus.Pass
            },
            {
                name: `Workflow: (${workflow.id})`,
                message: no_predecessors.length > 1
                ? `A valid workflow can only have 1 SIB without an incoming ControlFlow edge, this workflow has ${no_predecessors.length}: ${JSON.stringify(no_predecessors)}`
                : `OK`,
                status: no_predecessors.length > 1 ? ValidationStatus.Error : ValidationStatus.Pass
            }
        )


        responses.push(ValidationResponseAction.create(workflow.id,
                'control-flow',
                label_messages,
                action.requestId
            ));


        return responses;
    }

    override canExecute(action: ValidationRequestAction, ...args: unknown[]): Promise<boolean> | boolean {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }

    validateBranchLabels(sibs : Node[]): ValidationMessage[] {
        
        var messages: ValidationMessage[] = []
        sibs.forEach(
            (sib) => {
                
                const valid_branch_labels: string[] = sib.getProperty('validBranches')
                if (valid_branch_labels && valid_branch_labels.length !== 0 && sib.outgoingEdges.length !== 0){
                    const out_branch_labels = sib.outgoingEdges.map((a) => a.getProperty('label'))
                    const obl_set = new Set(out_branch_labels)

                    if (!out_branch_labels.every(bl => valid_branch_labels.includes(bl))){

                        const invalid_labels = out_branch_labels.filter(bl => !valid_branch_labels.includes(bl))

                        invalid_labels.forEach((a => {
                            messages.push({
                                name: `SIB ${sib.getProperty('label')}`,
                                message: `"${a}" is not a valid label for ControlFlow. Valid Options: ${valid_branch_labels.join(", ")}`,
                                status: ValidationStatus.Error
                            })
                        }))

                        
                    }
                    

                    if (out_branch_labels.length > 1 && obl_set.size != out_branch_labels.length){
                        out_branch_labels.filter((item, index) => out_branch_labels.indexOf(item) !== index).forEach((a)=>{


                            messages.push({
                                name: `SIB ${sib.getProperty('label')}`,
                                message: `${a} is a duplicate branch, each branch can be used at most once. Other Options: ${valid_branch_labels.filter(b => b != a).join(", ")}`,
                                status: ValidationStatus.Error
                            })
                        
                        })

                        
                    }
                }
            }
        );
        return messages
    }

    hasAnyCycle(sibs : Node[]) {
        const path = [];
        const cache = {};
    
        for (let sib of sibs) {
            if (this.isCyclic(sib, path, cache))
                return true;
        }
        return false;
     }

    isCyclic(node: Node, path: Node[], cache: { [key: string]: boolean }): boolean {
        // Could make this more useful by identify the path which has cycles?


        // Check the cache first
        if (cache[node.id] !== undefined) {
          return cache[node.id];
        }
      
        // Add the current node to the path
        path.push(node);
      
        // Check if the current node is already in the path, indicating a cycle
        if (path.indexOf(node, 0) !== path.lastIndexOf(node)) {
          // Cycle found, cache the result
          cache[node.id] = true;
          return true;
        }
      
        // Recursively check the node's successors
        for (let successor of node.successors) {
          if (this.isCyclic(successor, path, cache)) {
            // Cycle found, cache the result
            cache[node.id] = true;
            return true;
          }
        }
      
        // No cycle found, remove the current node from the path and cache the result
        path.splice(path.indexOf(node, 0), 1);
        cache[node.id] = false;
        return false;
    }





}




 // register into app
 LanguageFilesRegistry.register(ControlFlowCheck);
