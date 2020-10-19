import React, {Component} from 'react'
import { Sprite, Container, withApp } from 'react-pixi-fiber'
import Cross from './Cross'
import { getTheme } from '../project/Themer'

const DISTANCE = 10000

export default ({ grid, scale, bounds, color }) => {
    let {highlight, raised} = getTheme(color)
    highlight = `0x${highlight.slice(1)}`
    raised = `0x${raised.slice(1)}`

    const gridLines = []
    if (grid !== -1) {
        const gridSize = Math.pow(10, 4 - grid)
        const startX = Math.ceil(bounds.left / gridSize) * gridSize
        const startY = Math.ceil(bounds.top / gridSize) * gridSize

        if ((bounds.right - bounds.left) / gridSize <= 100)
            for (let i = startX; i < bounds.right; i += gridSize) {
                gridLines.push(<Cross key={`h${i}`}
                    x={i}
                    y={bounds.top}
                    scale={scale}
                    color={raised}
                    distance={bounds.bottom - bounds.top} />)
            }

        if ((bounds.bottom - bounds.top) / gridSize <= 100)
            for (let i = startY; i < bounds.bottom; i += gridSize) {
                gridLines.push(<Cross key={`v${i}`}
                    x={bounds.left}
                    y={i}
                    scale={scale}
                    color={raised}
                    distance={bounds.right - bounds.left} />)
            }
    }

    return <Container>
        {gridLines}
        <Cross x={0} y={0} scale={scale * 2} color={highlight} distance={DISTANCE * scale} />
    </Container>
}
