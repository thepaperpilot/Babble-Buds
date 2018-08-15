import React from 'react'
import './smallThumbnail.css'

export default props => (
    <div className="smallThumbnail-wrapper">
        <div className="smallThumbnail-img" style={{width: '20px', height: '20px'}}>
            <img alt={props.label} src={props.image}/>
        </div>
        <div className="smallThumbnail-label">{props.label}</div>
    </div>
)
