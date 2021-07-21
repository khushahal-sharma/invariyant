import React from 'react'
import { Circles, Rings } from 'react-loading-icons'
import './loading.css'

const Loading = () => {
    return (
        <div className="loading-overlay">
            <div>    
            <Circles fill='#ccc' />
            {/* <Rings fill='#ccc' /> */}
            </div>
        </div>
    )
}

export default Loading
