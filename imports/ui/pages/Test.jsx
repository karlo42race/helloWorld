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
		
		let method = "users.getFollowers",
				field1 = 11000,
				field2 = 10,
				field3 = 'followers',
				field4 = 9.90,
				field5 = 'sgd',
				userArray = ["LadPXDt6urSre2k3o", "s8tWQPTJGdEzWdf8a"]
		
		if(Roles.userIsInRole(Meteor.user(), ['superadmin', 'admin']) ) {

			Meteor.call(method, field1, field2, field3, field4, field5, (err, res) => {
				if(err) {
					console.log(err.reason);
					alert(err.reason)
				} else {
					console.log(`res ${res}`);
					this.setState({data: res});
				}
			});

		} else {
			alert('Test clicked');
		};
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
				<input type="password" id="password"/>
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
