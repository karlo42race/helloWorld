import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { render } from 'react-dom';

import { AppContainer } from '/imports/ui/layouts/App';

var routes = (
	<Router history={browserHistory}>
		<Route path="/" 
					component={AppContainer} >
		</Route>		
	</Router>
)

Meteor.startup(() => {
	render( 
   	routes, document.getElementById( 'render-target' ) 
  );	
});
