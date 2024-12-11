import { Container, Node,  GraphModel, LanguageFilesRegistry, ValidationHandler } from '@cinco-glsp/cinco-glsp-api';
import { Action, ValidationResponseAction, ValidationRequestAction, ValidationStatus, ValidationMessage } from '@cinco-glsp/cinco-glsp-common';

export class DataFlowCheck extends ValidationHandler {
    override CHANNEL_NAME: string | undefined = 'Workflow [' + this.modelState.graphModel.id + ']';

    override execute(action: ValidationRequestAction, ...args: unknown[]): Promise<Action[]> | Action[] {
        // next actions

        const modelElement = this.getElement(action.modelElementId);
        const name = `${modelElement.getSpec().label} (${modelElement.id})`
        const workflow = modelElement as GraphModel;

        var responses: ValidationResponseAction[] = []
        var label_messages: ValidationMessage[] = []
        const ok: ValidationMessage = {
            name: `Workflow : (${workflow.id})`,
            message: 'OK',
            status: ValidationStatus.Pass
        }

        // sibs ->
        const sibs = workflow.containedElements
        .filter(element => (element.type == "cincodebio:automatedsib" || element.type == "cincodebio:interactivesib"));

        sibs.forEach((sib) => {
            const csib = sib as Container
            var ips =  csib.containments.filter((a) => a.type === 'cincodebio:inputport')
            this.log('PATHS ' + csib.id)
            // const paths : string[][]= getAllPaths(csib)
            const rev_paths : string[][]= getAllPaths(csib,true)
            this.log(JSON.stringify(rev_paths))
            
            ips.forEach((ip) => {

                ip.incomingEdges.forEach((edge) => {
                    const op = this.getElement(edge.sourceID.toString()) as Node


                    const opt = op.getProperty('typeName')
                    const ipt = ip.getProperty('typeName')

                    // check for type mismatch
                    if ( opt !== ipt ){
                        const osib = op.parent as Container
                        label_messages.push(
                            {
                                name: `SIB : (${sib.id})`,
                                message: `Type Mismatch on ${sib.getProperty('label')}. Input of ${opt} from ${osib.getProperty('label')} is invalid. Valid input ${ipt}`,
                                status: ValidationStatus.Error
                            }
                        )
                    }

                    // check if input is from a SIB later in the control flow graph
                    if (!rev_paths.some((path) => path.some((value) => value.includes((op.parent as Container).id)))){

                        const osib = op.parent as Container
                        
                        label_messages.push(
                            {
                                name: `SIB : (${sib.id})`,
                                message: `Input of ${opt} from ${osib.getProperty('label')} is invalid, as ${osib.getProperty('label')} does not occur before or is on another branch to ${csib.getProperty('label')} in the Workflow`,
                                status: ValidationStatus.Error
                            }
                        )

                    }


                })

            })
            
        })
        
        
        // need to go through each input port for each sib and make sure it has an incoming edge
        // if it doesn't then that's an error
        // if it does, need to check for type mismatch
        if (label_messages.length > 0){
            responses.push(ValidationResponseAction.create(
                this.modelState.graphModel.id,
                'data-flow-check',
                label_messages,
                action.requestId
            ))
        }
        else{
            responses.push(ValidationResponseAction.create(
                this.modelState.graphModel.id,
                'data-flow-check',
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

}


function getAllPaths(egoNode: Container, pre: boolean = false): string[][] {
  const paths: string[][] = [];

  function dfs(node: Node, currentPath: string[]) {
    const newPath = [...currentPath, node.id];

    const outNodes = !pre ? node.successors : node.predecessors

    if (outNodes.length === 0 || currentPath.includes(node.id) ) {
      paths.push(newPath);
      return;
    }
    
    for (const successor of outNodes) {
      dfs(successor, newPath);
    }
  }
  const outNodes = !pre ? egoNode.successors : egoNode.predecessors

  for (const suc of outNodes) {
    dfs(suc, [egoNode.id]);
  }

  return paths;
}

 // register into app
 LanguageFilesRegistry.register(DataFlowCheck);
