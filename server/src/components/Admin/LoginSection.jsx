import React, { Component } from 'react'
import Centered from '../Containers/Centered.jsx'
import Section from '../Containers/Section.jsx'
import Field from '../Containers/Field.jsx'

export default class Admin extends Component {
    constructor(props) {
        super(props)

        this.state = {
            username: '',
            password: '',
            submitted: false,
            incorrect: false
        }

        this.username = React.createRef()

        this.onSubmit = this.onSubmit.bind(this)
        this.handleIncorrect = this.handleIncorrect.bind(this)
    }

    componentDidMount() {
        this.props.socket.on('loginFailed', this.handleIncorrect)
        this.username.current.focus()
    }

    componentWillUnmount() {
        this.props.socket.off('loginFailed', this.handleIncorrect)
    }

    onChange(key) {
        return e => {
            this.setState({
                [key]: e.target.value
            })
        }
    }

    onSubmit(e) {
        e.preventDefault()
        if (this.state.submitted) return
        const { username, password } = this.state
        this.props.socket.emit('login', username, password)
        this.setState({ submitted: true, incorrect: false })
    }

    handleIncorrect() {
        this.setState({ submitted: false, incorrect: true })
    }

    render() {
        const { username, password, submitted, incorrect } = this.state
        return <Centered>
            <Section title="Admin Login">
                <form onSubmit={this.onSubmit}>
                    <Field title="Username">
                        <input type="text" value={username} onChange={this.onChange('username')} disabled={submitted} ref={this.username} />
                    </Field>
                    <Field title="Password">
                        <input type="password" value={password} onChange={this.onChange('password')} disabled={submitted} />
                    </Field>
                    <button type="submit">Submit</button>
                    {incorrect ? <div className="login-error">Incorrect username or password!</div> : null}
                </form>
            </Section>
        </Centered>
    }
}
