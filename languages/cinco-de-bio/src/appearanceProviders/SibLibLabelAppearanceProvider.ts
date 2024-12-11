import { AppearanceProvider, Container, LanguageFilesRegistry, ModelElement } from '@cinco-glsp/cinco-glsp-api';
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
    Image,
} from '@cinco-glsp/cinco-glsp-common';

import {Node}  from '@cinco-glsp/cinco-glsp-api';


export class SibLibLabelAppearanceProvider extends AppearanceProvider {


    getAppearance(
        action: AppearanceUpdateRequestAction,
        ...args: unknown[]
    ): ApplyAppearanceUpdateAction[] | Promise<ApplyAppearanceUpdateAction[]> {

        // parse action
        const modelElementId: string = action.modelElementId;
        let element = this.getElement(modelElementId);

        const message = 'Element [' + element.type + ', ' + modelElementId + '] is woohoo changing appearance.';
        let labelNode = element as Node


        const shape = Object.assign({}, element.shape) as ContainerShape;

        const propertyValue = shape.children?.find(shape => shape.type == "IMAGE") as Image;

        let sib = labelNode.parent as Container
        this.log(JSON.stringify(labelNode.properties))
        if (labelNode.getProperty('name') != sib.getProperty('name')){
            labelNode.setProperty('name', sib.getProperty('name'))
        }
        if (labelNode.getProperty('label') != sib.getProperty('label')){
            labelNode.setProperty('label', sib.getProperty('label'))
        }


        const appearanceUpdate = ApplyAppearanceUpdateAction.create(modelElementId);


        // return [];
       return [appearanceUpdate];
    }
}
// register into app
LanguageFilesRegistry.register(SibLibLabelAppearanceProvider);
