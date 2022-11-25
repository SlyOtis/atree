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
    const listEl = useRef<HTMLDivElement>(null)
    const rootEl = useRef<HTMLDivElement>(null)
    const transTimeout = useRef(0)
    const maxTrans = useRef(0)
    const maxHeight = useRef(0)
    const rootHeight = useRef(0)

    const inset = props.inset || '40px'
    const delay = props.delay || 100
    const depthThreshold = props.depthThreshold || 1
    const depthParallels = props.depthParallels || 0
    const duration = props.duration || 250

    let _maxDepth = 0
    let _position = 0

    const positionItems = (item: any, isRoot: boolean, index: number = 0, depth: number = 0): ATreePositionResult => {
        const children: Array<T> = childKey in item ? item[childKey] : []
        _position++

        const pos = _position - 1
        const itemId = `atree-item-${depth}-${index}-${pos}`
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
                        className="atree-item"
                        data-index={index}
                        data-depth={depth}
                        data-position={pos}
                        data-count={_childCount}
                        style={{
                            marginLeft: `calc(${(isRoot ? 0 : depth)} * ${inset})`,
                            '--delay': `max(calc(${transDelay}ms - var(--start-offset)), 0ms)`,
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
                            key={`atree-path-${pos}`}
                            id={`atree-path-${pos}`}
                            className="atree-path"
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
        const list = listEl.current
        const root = rootEl.current

        if (!list || !root) {
            return
        }

        const {top: rTop, left: rLeft} = list.getBoundingClientRect()
        const points: Array<ATreePoint> = []

        maxHeight.current = 0

        list.querySelectorAll('.atree-item').forEach((el) => {
            const {height, left: elLeft, top: elTop} = el.getBoundingClientRect()
            const index = parseInt((el as HTMLDivElement).dataset['index'] || '0')
            const depth = parseInt((el as HTMLDivElement).dataset['depth'] || '0')
            const pos = parseInt((el as HTMLDivElement).dataset['position'] || '0')
            const left = Math.round(elLeft - rLeft)
            const top = Math.round(elTop - rTop)
            const center = Math.round(height / 2)

            maxHeight.current += height

            if (pos === 0) {
                rootHeight.current = height
                root.style.maxHeight = `${rootHeight.current}px`
            }

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

                const path = list.querySelector<SVGPathElement>(`.atree-arrow > #atree-path-${pos}`)
                if (path) {
                    path.setAttribute('d', `M${start.x},${start.y} L${turn.x},${turn.y} L${end.x},${end.y}`)
                    const len = path.getTotalLength()

                    if (depth <= depthParallels) {
                        path.style.setProperty('--delay', '0ms')
                        path.style.transitionDelay = '0ms !important'
                        path.style.transitionDuration = `calc(${index * (duration * depth)}ms - var(--start-offset))`
                    } else if (depth <= depthThreshold) {
                        path.style.setProperty('--duration', `calc((${pos} * ${delay}ms) - var(--start-offset))`)
                        path.style.setProperty('--delay', `calc(((${pos} * ${delay}ms) * var(--direction)) - var(--start-offset))`)
                        path.style.transitionDelay = 'calc((var(--direction) * var(--max-trans)) + (var(--delay) * (1 - (var(--direction) * 2))))'
                        path.style.transitionDuration = `calc((var(--duration) * (1 - var(--direction)) + (min(var(--duration), var(--max-trans)) * var(--direction)))`
                    } else {
                        path.style.setProperty('--delay', `calc((${pos} * ${delay}ms) - var(--start-offset))`)
                        path.style.transitionDelay = 'calc((var(--direction) * var(--max-trans)) + (var(--delay) * (1 - (var(--direction) * 2))) - var(--start-offset))'
                        path.style.transitionDuration = `${duration}ms`
                    }

                    path.style.setProperty('--size', `${len}`)
                    path.style.setProperty('--offset', `${len}`)
                } else {
                    console.error(`Failed to updated path data for #atree-path-${pos}`)
                }
            }
        })
    }, [listEl.current])

    useEffect(() => {
        const root = rootEl.current

        if (!root) {
            return
        }

        //TODO:: Fix initial set
        if (visible) {
            if (transTimeout.current > 0) {
                const start = Date.now() - transTimeout.current
                root.style.setProperty('--start-offset', `${start <= maxTrans.current ? start : 0}ms`)
            }
            transTimeout.current = Date.now()
            root.style.setProperty('--max-trans', `${maxTrans.current}ms`)
            root.style.transitionDuration = `calc(var(--max-trans) + (${delay}ms * min(2, var(--count))))`
            // root.style.transitionTimingFunction = 'ease-out'
            root.classList.add('atree-visible')
            root.style.maxHeight = `${maxHeight.current}px`
        } else {
            const start = Date.now()
            const transSum = start - transTimeout.current
            root.style.setProperty('--start-offset', `${transTimeout.current <= maxTrans.current ? transTimeout.current : 0}ms`)
            transTimeout.current = start
            root.style.setProperty('--max-trans', `min(${maxTrans.current}ms, max(${transSum}ms, ${duration + delay}ms))`)
            root.style.transitionDuration = `calc(var(--max-trans) + (${delay}ms * min(2, var(--count))))`
            // root.style.transitionTimingFunction = 'ease-in'
            root.classList.remove('atree-visible')
            root.style.maxHeight = `${rootHeight.current}px`
        }

    }, [rootEl.current, visible])


    return (
        <div
            ref={rootEl}
            className="atree-root"
            style={{
                maxHeight: '100px',
                '--delay': `${delay}ms`,
                '--duration': `${duration}ms`,
                '--count': `${_position}`,
                '--max-depth': `${_maxDepth}`,
                '--max-trans': `${maxTrans.current}ms`,
                '--start-offset': '0ms'
            } as any}
        >
            <div ref={listEl} className="atree-list">
                <div className="atree-items">
                    {items}
                </div>
                <svg className="atree-arrow" shapeRendering="crispEdges" width="100%" height="100%">
                    {paths}
                </svg>
            </div>
        </div>
    )
}

export default ATree