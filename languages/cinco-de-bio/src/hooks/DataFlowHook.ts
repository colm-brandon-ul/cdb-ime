
import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds, AbstractEdgeHook, Edge } from '@cinco-glsp/cinco-glsp-api';
import { MetaSpecification, getGraphSpecOf } from '@cinco-glsp/cinco-glsp-common';
import { Point } from 'sprotty-protocol';


export class DataFlowHook extends AbstractEdgeHook {
    override CHANNEL_NAME: string | undefined = 'DataFlowHook [' + this.modelState.root.id + ']';

   
    override postCreate(edge: Edge): void {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)
    }

}


LanguageFilesRegistry.register(DataFlowHook);
