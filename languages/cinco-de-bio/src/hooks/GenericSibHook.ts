import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds, DoubleClickHandler, ModelElement } from '@cinco-glsp/cinco-glsp-api';
import { Action, AppearanceUpdateRequestAction, DoubleClickAction, MetaSpecification, getGraphSpecOf } from '@cinco-glsp/cinco-glsp-common';
import { Point } from 'sprotty-protocol';


export class GenericSibHook extends DoubleClickHandler {
    override CHANNEL_NAME: string | undefined = 'HooksAndActions [' + this.modelState.graphModel.id + ']';

    override execute(action: DoubleClickAction, ...args: unknown[]): Promise<Action[]> | Action[] {
        // parse action
        const modelElementId: string = action.modelElementId;
        const element = this.modelState.index.findElement(modelElementId)! as ModelElement;

        this.dialog(`${element.getProperty('label')} Documentation`,element.getProperty('documentation'))

        // logging
        const message = 'Element [' + element.type + '] was double-clicked with id: ' + element.id;


        // next actions => find all activities and update their appearance
        // const consecutiveActions: Action[] = [AppearanceUpdateRequestAction.create(modelElementId)];
        return [];
    }

    override canExecute(action: DoubleClickAction, ...args: unknown[]): Promise<boolean> | boolean {
        const element = this.getElement(action.modelElementId);
        return element !== undefined;
    }
}



LanguageFilesRegistry.register(GenericSibHook);
