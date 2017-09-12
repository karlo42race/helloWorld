import React, { Component } from 'react';
import { ReactiveVar } from 'meteor/reactive-var';
import { createContainer } from 'meteor/react-meteor-data';

const currentPage = new ReactiveVar(0);

class TestPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
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
		let page = currentPage.get();
		
		let race = "27foC6M7TXLGLMj9m",
				limit = 10,
				skipCount = 0,
				userArray = ["LadPXDt6urSre2k3o", "s8tWQPTJGdEzWdf8a"]
				
		Meteor.call('results.getUserResults', skipCount, (err, res) => {
			if(err) {
				console.log(err.reason);
				alert(err.reason)
			} else {
				console.log(res);
				this.setState({data: res});
			}
		})
	}

	nextPage() {		
		let nextPage = currentPage.get() + 1;
		currentPage.set(nextPage);
	}

	render() {
		console.log(this.state.data);

		return(
			<div>
				<input type="text" id="email"/>
				<input type="text" id="password"/>
				<button onClick={this.login.bind(this)}>Enter</button>
				<br/>
				<input type="number" id="publicID"/>
				<button onClick={this.getData.bind(this)}>Test</button>
				<button onClick={this.nextPage.bind(this)}>Next</button>	
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
