const util = require('./util')
const fs = require('fs-extra')

const path = require('path')
const uuid = require('uuid')

const defaultLayout = require('./../data/default-layout.json')

module.exports = exports = {
    settings: {
        openProject: '',
        recentProjects: [],
        layout: defaultLayout,
        uuid: uuid.v4(),
        numAssets: 0
    },
    save: function() {
        fs.writeJson(path.join(require('electron').app.getPath('userData'), 'settings.json'), this.settings)
    },
    load: function(testing) {
        let obj
        if  (testing) obj = {}
        else if (fs.existsSync(path.join(require('electron').app.getPath('userData'), 'settings.json')))
            obj = fs.readJsonSync(path.join(require('electron').app.getPath('userData'), 'settings.json'))
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
        if (thumbnail) fs.writeFile(path.join(require('electron').app.getPath('userData'), `${filename}.png`), new Buffer(thumbnail, 'base64'), (err) => {
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
    }
}
