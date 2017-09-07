import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

class TestPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			user: {}
		}
	}

	login() {
		let email = document.getElementById('email').value;
		let password = document.getElementById('password').value;

		Meteor.loginWithPassword(email.trim(), password, (err) => {
			if(err) {
				console.log(err.reason);
				alert(err.reason);
			} else {
				alert('You are now logged in');
			}
		})
	}

	getData() {		
		Meteor.call('users.getBadges', 11000, (err, res) => {
			if(err) {
				console.log(err.reason);
				alert(err.reason)
			} else {
				console.log(res);
				this.setState({user: res});
			}
		})
	}

	render() {
		console.log(this.state.user);

		return(
			<div>
				<input type="text" id="email"/>
				<input type="text" id="password"/>
				<button onClick={this.login.bind(this)}>Enter</button>
				<br/>
				<input type="number" id="publicID"/>
				<button onClick={this.getData.bind(this)}>Test</button>				
			</div>
		)
	}
};

const TestContainer = createContainer(() => {
	return {		
		currentUser: Meteor.user()
	};
}, TestPage)

export { TestContainer };
