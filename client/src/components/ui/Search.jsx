import React, { Component } from 'react'
import './search.css'

class Search extends Component {
    render() {
    	const { value, onChange, ...props } = this.props
        return <div className="search">
            <input
                type="search"
                placeholder="All"
                value={value}
                onChange={e => onChange(e.target.value)}
                onContextMenu={() => onChange('')}
                {...props} />
        </div>
    }
}

export default Search
