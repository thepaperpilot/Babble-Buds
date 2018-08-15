import React from 'react'

export default () => (
    <div id="about" style={{display: 'none'}}>
        <h1 style={{color: '#15191f', fontSize: '90px', marginBottom: '30px', textShadow: '0 1px 1px #666'}}>Babble Movie Maker</h1>
        <strong style={{color: '#54647a'}}>{window.require('electron').remote.app.getVersion()}</strong><br/>
        <p style={{color: '#fff'}}>Babble Movie Maker is a free, open source tool for making cutscenes or videos using puppets created by Babble Buds. The software is written using electron and PIXI.js.</p>
    </div>
)
