import ConnectRoute from 'connect-route';
import { HTTP } from 'meteor/http';
import { WebApp } from 'meteor/webapp';

// redirect route to ticket portal
function toTicket(req, res, next){
	res.writeHead(307, { 'Location': 'https://team42race.on.spiceworks.com/portal' });
	res.end();
}

// redirect route to user guide
function toGuide(req, res, next){
	res.writeHead(307, { 'Location': 'https://web.42race.com/guides' });
	res.end();
}

// redirect route to race list
function toRaces(req, res, next){
	res.writeHead(307, { 'Location': 'https://web.42race.com/races' });
	res.end();
}

const middleware = ConnectRoute(function(router) {
	router.get('/contact', toTicket);
	router.get('/about', toGuide);
	router.get('/about/user-guide', toGuide);
	router.get('/virtual-race', toRaces);
	router.get('/virtual-race/*', toRaces);
});

WebApp.connectHandlers.use(middleware);
