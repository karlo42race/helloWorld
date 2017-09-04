import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

class MailChimpAPI {
  constructor() {
    this.methods = {
      lists: {
        subscribe({ list_id, subscriber_hash }) {
          return { type: 'PUT', endpoint: `/lists/${list_id}/members/${subscriber_hash}` };
        },
      },
    };
  }

  buildRequestArguments(type, options) {
  	const apiKey = "7865cee299f652a82917729da8244ff6-us13";
    const payload = { auth: `mailchimp:${apiKey}` };

    if (type === 'GET') {
      payload.params = options || {};
    } else {
      payload.data = options || {};
    }

    return payload;
  }

  request(action, options) {
    const type = action.type;
    const url = `https://us13.api.mailchimp.com/3.0${action.endpoint}`;
    const args = this.buildRequestArguments(type, options);
    const request = HTTP.call(type, url, args);

    if (request.error) return request.error;
    return request;
  }
 
  action(action, method, params) {
    const methodToCall = this.methods[action][method](params);
    return this.request(methodToCall, params);
  }

  lists(method, params) {
    return this.action('lists', method, params);
  }
}

export const MailChimp = new MailChimpAPI();
