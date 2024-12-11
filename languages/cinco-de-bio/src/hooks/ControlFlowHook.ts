
import { Node, AbstractNodeHook, LanguageFilesRegistry, Container, ResizeBounds, Edge, AbstractEdgeHook } from '@cinco-glsp/cinco-glsp-api';
import { MetaSpecification, getGraphSpecOf } from '@cinco-glsp/cinco-glsp-common';
import { Point } from 'sprotty-protocol';


export class ControlFlowHook extends AbstractEdgeHook {
    override CHANNEL_NAME: string | undefined = 'ControlFlowHook [' + this.modelState.root.id + ']';

   
    override postCreate(edge: Edge): void {
        // node.setProperty("name", `${this.VERBS[this.random(0, this.VERBS.length)]} ${this.NOUNS[this.random(0, this.NOUNS.length)]}`)

        const sourceSib = edge.source as Container
        const targetSib = edge.target as Container

        const sourcePrime = sourceSib.primeReference as Container


        const names = sourcePrime.containments.filter((a) => a.type === 'siblibrary:branch');
        if (names.length != 0){
            edge.setProperty('label',names[0].getProperty('name'))
        }

    }

}


LanguageFilesRegistry.register(ControlFlowHook);
