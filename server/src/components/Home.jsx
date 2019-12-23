import React, { Component } from 'react'
import Stage from './Stage/Stage.jsx'
import IntroSection from './Home/IntroSection.jsx'
import DownloadButton from './Home/DownloadButton.jsx'
import PreviewSection from './Home/PreviewSection.jsx'
import Footer from './Home/Footer.jsx'
 
export default class Home extends Component {
    render() {
        return <React.Fragment>
            <Stage />
            <IntroSection />
            <DownloadButton />
            <PreviewSection />
            <Footer />
        </React.Fragment>
    }
}
