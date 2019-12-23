const {app} = require('electron')
const util = require('./util')
const fs = require('fs-extra')

const path = require('path')
const uuid = require('uuid')

const filepath = path.join(app.getPath('userData'), 'settings.json')
const defaultLayout = require('./../data/default-layout.json')

module.exports = exports = {
    settings: {
        openProject: '',
        recentProjects: [],
        layout: defaultLayout,
        uuid: uuid.v4(),
        numAssets: 0,
        address: 'babblebuds.xyz'
    },
    save: function() {
        fs.ensureDirSync(app.getPath('userData'))
        fs.writeJsonSync(filepath, this.settings)
    },
    load: function() {
        let obj
        if (fs.existsSync(filepath))
            obj = fs.readJsonSync(filepath)
        else return
                
        Object.assign(this.settings, obj)
        if (!this.settings.recentProjects)
            this.settings.recentProjects = []
    },
    addRecentProject: function(thumbnail) {
        if (this.settings.recentProjects.indexOf(this.settings.openProject) !== -1) {
            this.settings.recentProjects.splice(this.settings.recentProjects.indexOf(this.settings.openProject), 1)
        }
        this.settings.recentProjects.splice(0, 0, this.settings.openProject)
        while (this.settings.recentProjects.length > 3)
            this.settings.recentProjects.splice(3, 1)
        var filename = util.slugify(this.settings.openProject)
        if (thumbnail) fs.writeFileSync(path.join(app.getPath('userData'), `${filename}.png`), new Buffer(thumbnail, 'base64'), (err) => {
            if (err) console.log(err)
        })
    },
    closeProject: function() {
        this.settings.openProject = ''
    },
    setLayout: function(layout) {
        this.settings.layout = layout
    },
    setNumAssets: function(numAssets) {
        this.settings.numAssets = numAssets
    },
    setAddress: function(address) {
        this.settings.address = address
    }
}
