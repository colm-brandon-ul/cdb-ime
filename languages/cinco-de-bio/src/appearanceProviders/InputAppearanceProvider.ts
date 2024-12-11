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


export class InputAppearanceProvider extends AppearanceProvider {


    getAppearance(
        action: AppearanceUpdateRequestAction,
        ...args: unknown[]
    ): ApplyAppearanceUpdateAction[] | Promise<ApplyAppearanceUpdateAction[]> {

        // parse action
        const modelElementId: string = action.modelElementId;
        const element = this.getElement(modelElementId);

        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';
        
        let labelNode = element as Node
        this.log('HELLO')
        this.log(JSON.stringify(labelNode.properties))
        this.log(`${labelNode.isPrime}`)

        if (labelNode.isPrime && labelNode.primeReference?.properties){
            this.log(JSON.stringify(labelNode.primeReference?.properties))
            this.log(JSON.stringify(labelNode.properties))
            labelNode.properties = labelNode.primeReference?.properties
        }
        

        return [];
       // return [appearanceUpdate];
    }
}
// register into app
LanguageFilesRegistry.register(InputAppearanceProvider);
