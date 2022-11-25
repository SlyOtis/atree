import React, {ReactNode, useEffect, useRef} from 'react';
import './atree.css'

interface ATreePositionResult {
    items?: ReactNode,
    paths?: ReactNode
}

type ATreePoint = {
    x: number,
    y: number
}

export interface ATreeProps<T> {
    /**
     * The initial root element
     */
    root: T
    /**
     * The key to use on the root element from where to pick children
     */
    childKey: keyof T
    /**
     * Callback for when an item needs to be rendered
     * @param item The current item to render
     * @param index The index of the item at the current depth
     * @param dept The depth in the three for the given item
     * @param position The absolute position in the tree, real index
     */
    children: (item: T, index: number, dept: number, position: number) => ReactNode
    /**
     * The inset as a css size ex: 1rem or 14px. (default is 40px)
     * TODO:: This can easily be something else if that is desirable
     */
    inset?: string
    /**
     * The delay to use between animations.
     */
    delay?: number
    /**
     * The duration of the individual animations.
     */
    duration?: number
    /**
     * The threshold for when to switch from delay to duration for path drawing
     * this gives the effect of the line to the next branch being drawn while the
     * branch itself is drawn.
     */
    depthThreshold?: number
    /**
     * All depths below this threshold will run in paralell.
     */
    depthParallels?: number
    /**
     * Hide show the tree
     */
    visible?: boolean
}

export const ATree = <T, >(props: ATreeProps<T>) => {

    const {root, children: renderItem, childKey, visible} = props
    const rootEl = useRef<HTMLDivElement>(null)
    const maxTrans = useRef(0)
    const transTimeout = useRef(0)

    const inset = props.inset || '40px'
    const delay = props.delay || 100
    const depthThreshold = props.depthThreshold || 1
    const depthParallels = props.depthParallels || 0
    const duration = props.duration || 250
    let _position = 0
    let _maxDepth = 0

    const positionItems = (item: any, isRoot: boolean, index: number = 0, depth: number = 0): ATreePositionResult => {
        const children: Array<T> = childKey in item ? item[childKey] : []
        _position++

        const pos = _position - 1
        const itemId = `athree-item-${depth}-${index}-${pos}`
        const transDelay = depth <= depthParallels ? index * (delay * depth) : delay * pos

        if (depth > _maxDepth) {
            _maxDepth = depth
        }

        if (transDelay > maxTrans.current) {
            maxTrans.current = transDelay
        }

        let _childCount = 0

        const {items: _items, paths: _paths} = children.reduce((prev: any, curr, i) => {
            const {items: ci, paths: cp} = positionItems(curr, false, i, depth + 1)
            _childCount++
            return {
                items: (
                    <>
                        {prev?.items}
                        {ci}
                    </>
                ),
                paths: (
                    <>
                        {prev?.paths}
                        {cp}
                    </>
                )
            }
        }, {})

        return {
            items: (
                <>
                    <div
                        id={itemId}
                        key={itemId}
                        className="athree-item"
                        data-index={index}
                        data-depth={depth}
                        data-position={pos}
                        data-count={_childCount}
                        style={{
                            marginLeft: `calc(${(isRoot ? 0 : depth)} * ${inset})`,
                            '--delay': `${transDelay}ms`,
                            '--duration': `${duration}ms`
                        } as any}
                    >
                        {renderItem(item, index, depth, pos)}
                    </div>
                    {_items}
                </>
            ),
            paths: (
                <>
                    {!isRoot && (
                        <path
                            key={`athree-path-${pos}`}
                            id={`athree-path-${pos}`}
                            className="athree-path"
                            fill="transparent"
                            stroke="#000000"
                            strokeWidth="3"
                        />
                    )}
                    {_paths}
                </>
            )
        }
    }

    //TODO:: UseMemo for the initial calculation, separate into own component
    const {items, paths} = positionItems(root, true)

    //TODO:: Add a ref for real position


    useEffect(() => {
        const root = rootEl.current

        if (!root) {
           return
        }

        const {top: rTop, left: rLeft} = root.getBoundingClientRect()
        const points: Array<ATreePoint> = []

        rootEl.current.querySelectorAll('.athree-item').forEach((el, i) => {
            const {height, left: elLeft, top: elTop} = el.getBoundingClientRect()
            const index = parseInt((el as HTMLDivElement).dataset['index'] || '0')
            const depth = parseInt((el as HTMLDivElement).dataset['depth'] || '0')
            const position = parseInt((el as HTMLDivElement).dataset['position'] || '0')
            const count = parseInt((el as HTMLDivElement).dataset['count'] || '0')
            const left = Math.round(elLeft - rLeft)
            const top = Math.round(elTop - rTop)
            const center = Math.round(height / 2)

            const start: ATreePoint = points[depth - 1] || {
                x: left + center,
                y: top + center
            }

            if (index === 0 && depth === 0) {
                points[0] = start
            } else {

                const turn: ATreePoint = {
                    x: start.x,
                    y: top + center
                }

                const end: ATreePoint = {
                    x: left + center,
                    y: turn.y
                }

                if (depth <= depthThreshold) {
                    points[depth] = end
                    points[depth - 1] = start
                } else {
                    points[depth] = end
                    points[depth - 1] = turn
                }

                const path = root.querySelector<SVGPathElement>(`.athree-arrow > #athree-path-${position}`)
                if (path) {
                    path.setAttribute('d', `M${start.x},${start.y} L${turn.x},${turn.y} L${end.x},${end.y}`)
                    const len = path.getTotalLength()

                    if (depth <= depthParallels) {
                        path.style.setProperty('--delay', `${tdl}ms`)
                        path.style.setProperty('--duration', `${tdur}ms`)
                        path.style.setProperty('--dur-up', `${tdur}ms`)

                        // return {
                        //     delay: 0,
                        //     duration: index * (duration * depth)
                        // }
                    } else if (depth <= depthThreshold) {
                        // return {
                        //     delay: 0,
                        //     duration: position * delay
                        // }
                    } else {
                        // return {
                        //     delay: position * delay,
                        //     duration
                        // }
                    }

                    // path.style.transitionDelay = `${tdl}ms`
                    // path.style.transitionDuration = `${tdur}ms`
                    // path.style.strokeDasharray = `${len}`
                    // path.style.strokeDashoffset = `${len}`

                    // path.style.setProperty('--delay', `${tdl}ms`)
                    // path.style.setProperty('--duration', `${tdur}ms`)
                    path.style.setProperty('--size', `${len}`)
                    path.style.setProperty('--offset', `${len}`)
                } else {
                    console.error(`Failed to updated path data for #athree-path-${position}`)
                }
            }
        })
    }, [rootEl.current])

    useEffect(() => {
        const root = rootEl.current

        if (!root) {
            return
        }

        if (visible) {
            transTimeout.current = Date.now()
            root.style.setProperty('--max-trans', `${maxTrans.current}ms`)
        } else {
            const transSum = Date.now() - transTimeout.current
            root.style.setProperty('--max-trans', `min(${maxTrans.current}ms, ${transSum}ms)`)
        }

        root.classList[visible ? 'add' : 'remove']('athree-visible')

    }, [rootEl.current, visible])


    return (
        <div
            ref={rootEl}
            className="athree-root"
            style={{
                '--count': `${_position}`,
                '--depth': `${_maxDepth}`,
                '--max-trans': `${maxTrans.current}ms`
            } as any}
        >
            <div className="athree-items">
                {items}
            </div>
            <svg className="athree-arrow" shapeRendering="crispEdges" width="100%" height="100%">
                {paths}
            </svg>
        </div>
    )
}

export default ATree