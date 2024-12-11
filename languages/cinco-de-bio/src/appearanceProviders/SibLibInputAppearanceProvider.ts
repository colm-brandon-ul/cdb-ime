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


export class SibLibInputAppearanceProvider extends AppearanceProvider {


    getAppearance(
        action: AppearanceUpdateRequestAction,
        ...args: unknown[]
    ): ApplyAppearanceUpdateAction[] | Promise<ApplyAppearanceUpdateAction[]> {

        // parse action
        const modelElementId: string = action.modelElementId;
        const element = this.getElement(modelElementId);

        const message = 'Element [' + element.type + ', ' + modelElementId + '] is changing appearance.';
        this.log(message);



        return [];
       // return [appearanceUpdate];
    }
}
// register into app
LanguageFilesRegistry.register(SibLibInputAppearanceProvider);
