import { AppearanceProvider, LanguageFilesRegistry, ModelElement } from '@cinco-glsp/cinco-glsp-api';
import {
    AbstractShape,
    Appearance,
    ApplyAppearanceUpdateAction,
    Color,
    Ellipse,
    Font,
    LineStyle,
    NodeStyle,
    Rectangle,
    AppearanceUpdateRequestAction,
    ContainerShape,
    Text,
} from '@cinco-glsp/cinco-glsp-common';

import {Node}  from '@cinco-glsp/cinco-glsp-api';


export class TaskAppearanceProvider extends AppearanceProvider {


    getAppearance(
        action: AppearanceUpdateRequestAction,
        ...args: unknown[]
    ): ApplyAppearanceUpdateAction[] | Promise<ApplyAppearanceUpdateAction[]> {

        // parse action
        const modelElementId: string = action.modelElementId;
        const element = this.getElement(modelElementId);

        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';

        // Creat a label, input & output


        const shape = element.shape as ContainerShape;
        // const propertyValue = shape.children?.find(shape => shape.name == "propertyValue") as Text;

        // 0 transparency when no incoming 1 otherwise
        // (propertyValue.appearance as Appearance).transparency = Math.max((element as Node).incomingEdges.length, 1);



        // const appearanceUpdate = ApplyAppearanceUpdateAction.create(modelElementId);
 


        



        return [];
       // return [appearanceUpdate];
    }
}
// register into app
LanguageFilesRegistry.register(TaskAppearanceProvider);
