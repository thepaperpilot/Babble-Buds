/// <reference types="react" />
import { DropTarget } from 'dnd-core';
import { DropTargetSpec, DropTargetMonitor } from './interfaces';
export interface Target extends DropTarget {
    receiveProps(props: any): void;
    receiveMonitor(monitor: any): void;
    receiveComponent(component: any): void;
}
export default function createTargetFactory<P, S, TargetComponent extends React.Component<P, S> | React.StatelessComponent<P>>(spec: DropTargetSpec<P, S, TargetComponent>): (monitor: DropTargetMonitor) => Target;
