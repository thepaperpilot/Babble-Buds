/// <reference types="react" />
import { DragSource } from 'dnd-core';
import { DragSourceSpec, DragSourceMonitor } from './interfaces';
export interface Source extends DragSource {
    receiveProps(props: any): void;
    receiveComponent(component: any): void;
}
export default function createSourceFactory<P, S, TargetComponent extends React.Component<P, S> | React.StatelessComponent<P>, DragObject>(spec: DragSourceSpec<P, S, TargetComponent, DragObject>): (monitor: DragSourceMonitor) => Source;
