export default function (...actions) {
    return actions.reduce((acc, curr) => {
        acc[curr] = (...args) => ({ type: 'fake action', f: curr, args })
        return acc
    }, {})
}
