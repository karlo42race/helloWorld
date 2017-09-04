import React from 'react';
import ReactHTMLEmail, { Box, Email, Item, Span, renderEmail, A, Image } from 'react-html-email';

ReactHTMLEmail.injectReactEmailAttributes();

const css = `
@media only screen and (max-device-width: 480px) {
  font-size: 20px !important;
}
.white-space-pre {
   white-space: pre-wrap;
}`.trim();

// send to user template
const AlertFraudEmail = ({values, user_name, user_publicID, submissionID}) => { 	 	
	const { distance, timing_per_km, hour, min, sec } = values;	
	let timing_min = Math.floor(timing_per_km / 60);				
	let timing_sec = Math.round(timing_per_km % 60);
	let url = `https://admin.42race.com/submissions/edit/${submissionID}`;

  return (
	  <Email title="fraud alert" headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Potential Fraud</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	  		<h3><Span fontSize={26}><strong>Potential fraud submission: </strong></Span></h3>		    			    		    	
	    	<p style={{lineHeight: '150%'}}>
	    		<Span>User: {user_name}</Span><br/>
	    		<Span>UserID: {user_publicID}</Span><br/>
		    	<Span>Distance: {distance}km</Span><br/>
		    	<Span>Timing: {hour}: {min}: {sec}</Span><br/>			    	
		    	<Span>Pace: {timing_min}: {timing_sec}</Span><br/>
		    	<Span>Please investigate. <a href={url}>Link</a></Span>
	    	</p>				
	    	
	    	<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>		    
		    </Item>
	    </Box>

	  </Email>
  )
};

export const AlertFraudToAdmin = (values, user_name, user_publicID, submissionID) => {		
  return renderEmail( <AlertFraudEmail values={values} 
  																		 user_name={user_name} 
  																		 user_publicID={user_publicID}
  																		 submissionID={submissionID} /> );  											
};
