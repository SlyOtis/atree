import React, {useState} from 'react'
import ATree from './component'
import './App.css'

type Item = {
    name: string,
    desc: string,
    children: Array<Item>
}

function App() {

    const data: Item = {
        name: '0. Root Test',
        desc: 'Root Desc',
        children: new Array(4).fill({
            name: '0. Test',
            desc: 'importatnt description',
            children: new Array(4).fill({
                name: '1. Sub Test',
                desc: 'Some random desc',
                children: new Array(3).fill({
                    name: '2. Sub sub test',
                    desc: 'What is this?'
                })
            })
        })
    }

    const [visible, setVisible] = useState(false)

    return (
        <div className="root">
            <div className="header">
                <span>Test</span>
                <button onClick={() => setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button>
            </div>

            <div className="list">
                <ATree<Item>
                    root={data}
                    childKey="children"
                    visible={visible}
                >
                    {(item, index, dept) => (
                        <div className="item">
                            <svg height="50" width="50" viewBox={"0 0 100 100"}>
                                <circle cx="50" cy="50" r="50" fill="blue"/>
                            </svg>
                            <div className="item-info">
                                <span>{item.name}</span>
                                <span>{item.desc}</span>
                            </div>
                        </div>
                    )}
                </ATree>
            </div>
        </div>
    )
}

export default App
