import React from 'react';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import { render } from 'react-dom';

import { AppContainer } from '/imports/ui/layouts/App';
import { TestContainer } from '/imports/ui/pages/Test';

var routes = (
	<Router history={browserHistory}>
		<Route path="/" 
					component={AppContainer} />
		<Route path="/test" component={TestContainer} />
	</Router>
)

Meteor.startup(() => {
	render( 
   	routes, document.getElementById( 'render-target' ) 
  );	
});
