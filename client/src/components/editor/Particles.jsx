import { CustomPIXIComponent } from 'react-pixi-fiber'
import path from 'path'

const { Container, Texture, TextureCache } = window.PIXI
const Emitter = require('pixi-particles').Emitter

const defaultParticle = Texture.from('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAQAAAC0jZKKAAACPElEQVR4AbXXcW/TMBAF8EtCypa1LCDB9/98ILG1dKNNCOZZT8h6N4562eZTzH8/ni6dfWns4kqtvbMOT2tmv+0XasG/F1aTLFxd5lDcCS8o0tyX58K9bVA9WZe40LNNqLkevrJr1HvrC1vgQoM820/UqQZubQBKWDKjDJjP+wg41/J/eAOQsGb2rWDlvKzMTyEMaJvBIHNpBdswOfhoZ4VL2h3Irc+srSiJPYv9B1Mr3IHcCS2ZJTFf2+RZ1NEWD5PF7mmQ/nfs85I9klb4KrNCa2YkZitcXmVZpwL3zFtwpYH6l3cWtqDMPP+Fb+zWPthW6BvUIJmZuOTN7APqKOjB9vZAuAM6ArvFE9CSeI5Y1B7PPfAFMPKMKMWVZmbCzKusoveoKcODjQDzgx3c6GnUFnADOAFGV5V16B7PI2BkBRjgmf4IWBbYu8I6lPuhSa2w4xP8k7CF/l5Q7HuiZW9ST+wpjgKLvP9ed6gAJXztWcG/2CaAJ/tKlJSnm7RTTHHATQAnwAFKWCn/H3y2eH2L2ZfDIf06rXD8m768l//cAvzN/kBe709a8cPFQ4jXFA8hHpvVh1D9scmrqfbYrD/oO0s5caYrDvraqwlwW3811V6mvXUrLtOq6x+NYCt0vIqv/2hgcUPWqoFFRixlB9tEIxZHWKHJLmuGQraifijUMTbIq63QzDLGrh+8wVYO3rI6nzdohc+81H3cDHiijxvNfAJ9Wv855hJL5nnlB2Tw8ojzC7UelrXqk/cPn233eGpGsfAAAAAASUVORK5CYII=')

const TYPE = 'Particles'

export const behavior = {
    customDisplayObject: () => new Container(),
    customApplyProps: (instance, oldProps, newProps) => {
        if (oldProps.emitter !== newProps.emitter || oldProps.location !== newProps.location) {
            if (instance.emitter)
                instance.emitter.destroy()
            const image = newProps.location ? TextureCache[path.join(newProps.assetsPath, newProps.location)] : defaultParticle
            let emitter = new Emitter(instance, [image], Object.assign({}, newProps.emitter, { pos: { x: 0, y: 0 } }))
            emitter.emit = true
            emitter.autoUpdate = newProps.isActive
            emitter.update(newProps.emitter.lifetime.max + newProps.emitter.frequency)
            instance.emitter = emitter
        }
        if (newProps.alpha !== oldProps.alpha)
            instance.alpha = newProps.alpha
        if (newProps.scale !== oldProps.scale){
            instance.scale.x = newProps.scale[0]
            instance.scale.y = newProps.scale[1]
        }
        if (newProps.isActive !== oldProps.isActive)
            instance.emitter.autoUpdate = newProps.isActive
    }
}

export default CustomPIXIComponent(behavior, TYPE)
