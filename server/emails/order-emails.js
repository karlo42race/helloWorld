import React from 'react';
import ReactHTMLEmail, { Box, Email, Item, Span, renderEmail, A, Image } from 'react-html-email';
import moment from 'moment-timezone-with-data-2010-2020';
 
// set up React to support a few HTML attributes useful for legacy clients 
ReactHTMLEmail.injectReactEmailAttributes()

const css = `
@media only screen and (max-device-width: 480px) {
  font-size: 20px !important;
}
.white-space-pre {
   white-space: pre-wrap;
}`.trim()

const Footer = () => {
	return(
		<p style={{lineHeight: '150%'}}>
    	<Span color="gray">Email: contact@42race.com</Span><br/>
    	<Span color="gray">Website: <A href="https://web.42race.com"> https://web.42race.com </A> </Span><br/>
    	<Span color="gray">Facebook: <A href="https://www.facebook.com/42race/"> https://www.facebook.com/42race/ </A></Span><br/>		    	
  	</p>
	)
}

const RaceDetails = ({race_name, race_start_date, race_end_date, category}) => {	
	return(
		<p style={{lineHeight: '150%'}}>
  		<Span>Race Name: {race_name}</Span><br/>
  		<Span>Race Period: {moment.tz(race_start_date, 'Asia/Singapore').format('D MMM (H:mma) z')} to {moment.tz(race_end_date, 'Asia/Singapore').format('D MMM (H:mma) z')}</Span><br/>	 
  		<Span>Category: {category} km</Span><br/>
			<Span>Game Rules & Results Verification: Please visit our race page for more information.</Span>
		</p>
	)
}
// send to user template
const OrderEmailToUserTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum}) => { 
	const { 
		address, address2, country, postal, unit_number, email, 
		price, currency, category, medal_engraving, addOn
	} = values;	

	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency, showPrice;
	switch(currency) {
		case 'myr':
			showCurrency = 'RM';
			showPrice = price.toFixed(2);
			break;
		case 'idr':
			showCurrency = 'Rp';
			showPrice = price;
			break;
		default:
		 showCurrency = 'S$';
		 showPrice = price.toFixed(2);
		 break;
	};
 	
  return (
	  <Email title={race_name + ' customer order'} headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Thank you for your Order</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	  		<h3><Span fontSize={26}><strong>Welcome to {race_name}</strong></Span></h3>
		    	<p><Span fontSize={18}><strong>Dear {name},</strong></Span></p>
		    	<p><Span>Congratulations and thank you for registering for the {race_name}!</Span></p>
		    	<p style={{lineHeight: '150%'}}><Span>Your registration confirms that you have agreed to the Rules and Regulations of {race_name} as stipulated by the Organiser.</Span></p>
		      <p style={{lineHeight: '150%'}}><Span>You may access your user dashboard at <A href="https://web.42race.com/my-account"> https://web.42race.com/dashboard </A> to manage your account details.</Span></p>		    
	    	<hr/>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Price: {showCurrency}{showPrice}</Span><br/>
			    	<Span>Participant Name: {name}</Span><br/>
			    	<Span>Email: {email}</Span><br/>			    	
			    	<Span>Address: <br/>{address} <br/>{address2} {unit_number}</Span><br/>				    	
			    	<Span>Country: {country}</Span><br/>	
			    	<Span>Postal: {postal}</Span><br/>				    	
			    	{(medal_engraving) && (medal_engraving !== '') ? <Span>Medal Engraving: {medal_engraving} <br/></Span> : <Span/>}
			    	{(addOn && (addOn !== '') ) ? <Span>Add On: <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
			    	
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>
				<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} />
	    	<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

export const OrderEmailToUser = (currentUser, values, raceData, orderTimestamp, orderNum) => {		
  return renderEmail( <OrderEmailToUserTemplate   											
  											currentUser={currentUser}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );  											
};


// order email to user with product addon
const OrderEmailToAdminTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum}) => { 
	const { 
		address, address2, country, postal, unit_number, email, 
		price, currency, category, medal_engraving, addOn
	} = values;	
	
	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency, showPrice;
	switch(currency) {
		case 'myr':
			showCurrency = 'RM';
			showPrice = price.toFixed(2);
			break;
		case 'idr':
			showCurrency = 'Rp';
			showPrice = price;
			break;
		default:
		 showCurrency = 'S$';
		 showPrice = price.toFixed(2);
		 break;
	};
	
  return (
	  <Email title="21Day Challenge Customer Order" headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>New Order from {name}</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Price: {showCurrency}{showPrice}</Span><br/>
			    	<Span>Participant Name: {name}</Span><br/>
			    	<Span>Email: {email}</Span><br/>
			    	<Span>Registration Date: {orderTimestamp}</Span><br/>
			    	<Span>Address: <br/>{address} <br/>{address2} {unit_number}</Span><br/>
			    	<Span>Country: {country}</Span><br/>
			    	<Span>Postal: {postal}</Span><br/>
			    	{((medal_engraving) && (medal_engraving !== '') || (medal_engraving !== ['',''])) ? 
			    		<span>
			    		{(Array.isArray(medal_engraving)) ? 
			    			<Span>Medal Engraving: {medal_engraving[0]}, {medal_engraving[1]}<br/></Span> :
			    			<Span>Medal Engraving: {medal_engraving} <br/></Span>
			    		}
			    		</span> : <Span/>
			    	}			    				    	
			    	{(addOn !== '') ? <Span>Add On:  <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>	    	
	    	<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} /> 
				<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

// notice we are taking a name parameter now, and passing that into our ContactMeTemplate as a prop called name
export const OrderEmailToAdmin = (currentUser, values, raceData, orderTimestamp, orderNum) => {	
	
  return renderEmail(<OrderEmailToAdminTemplate 
  											currentUser={currentUser}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );							
};



// emails for free races
// send to user template
const OrderFreeEmailToUserTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum}) => { 
	const { 
		address, address2, country, postal, unit_number, email, 
		price, currency, category, medal_engraving, addOn
	} = values;	
	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency = '$'; 
 	
  return (
	  <Email title={race_name + ' customer order'} headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Thank you for your Order</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	  		<h3><Span fontSize={26}><strong>Welcome to {race_name}</strong></Span></h3>
		    	<p><Span fontSize={18}><strong>Dear {name},</strong></Span></p>
		    	<p><Span>Congratulations and thank you for registering for the {race_name}!</Span></p>
		    	<p style={{lineHeight: '150%'}}><Span>Your registration confirms that you have agreed to the Rules and Regulations of {race_name} as stipulated by the Organiser.</Span></p>
		      <p style={{lineHeight: '150%'}}><Span>You may access your user dashboard at <A href="https://web.42race.com/my-account"> https://web.42race.com/dashboard </A> to manage your account details.</Span></p>		    
	    	<hr/>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Price: {showCurrency}{price.toFixed(2)}</Span><br/>
			    	<Span>Participant Name: {name}</Span><br/>
			    	<Span>Email: {email}</Span><br/>
			    	{(medal_engraving) && (medal_engraving !== '') ? <Span>Medal Engraving: {medal_engraving} <br/></Span> : <Span/>}
			    	{(addOn && (addOn !== '') ) ? <Span>Add On: <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
			    	
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>
				<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} />
	    	<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

export const OrderFreeEmailToUser = (currentUser, values, raceData, orderTimestamp, orderNum) => {		
  return renderEmail( <OrderFreeEmailToUserTemplate   											
  											currentUser={currentUser}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );  											
};

// emails for free races
// order email to user with product addon
const OrderFreeEmailToAdminTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum}) => { 
	const { 
		email, price, currency, category, medal_engraving, addOn
	} = values;	
	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency = '$';

  return (
	  <Email title="21Day Challenge Customer Order" headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>New Order from {name}</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Price: {showCurrency}{price.toFixed(2)}</Span><br/>
			    	<Span>Participant Name: {name}</Span><br/>
			    	<Span>Email: {email}</Span><br/>
			    	<Span>Registration Date: {orderTimestamp}</Span><br/>			    	
			    	{((medal_engraving) && (medal_engraving !== '') || (medal_engraving !== ['',''])) ? 
			    		<span>
			    		{(Array.isArray(medal_engraving)) ? 
			    			<Span>Medal Engraving: {medal_engraving[0]}, {medal_engraving[1]}<br/></Span> :
			    			<Span>Medal Engraving: {medal_engraving} <br/></Span>
			    		}
			    		</span> : <Span/>
			    	}			    				    	
			    	{(addOn !== '') ? <Span>Add On:  <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>	    	
	    	<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} /> 
				<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

// notice we are taking a name parameter now, and passing that into our ContactMeTemplate as a prop called name
export const OrderFreeEmailToAdmin = (currentUser, values, raceData, orderTimestamp, orderNum) => {	
	
  return renderEmail(<OrderFreeEmailToAdminTemplate 
  											currentUser={currentUser}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );							
};



// send to user who reg for buddy run template
const OrderEmailToUserWithBuddyTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum, partner}) => { 
	const { 
		address, address2, country, postal, unit_number, email, 
		price, currency, category, medal_engraving, addOn
	} = values;	
	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency = '$';
	if(currency == 'myr') {
		showCurrency = 'RM';
 	} 
	
	// only for PA order
 	let { collection1, collection2 } = values;
 	
  return (
	  <Email title={race_name + ' customer order'} headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Thank you for your Order</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	  		<h3><Span fontSize={26}><strong>Welcome to {race_name}</strong></Span></h3>
		    	<p><Span fontSize={18}><strong>Dear {name},</strong></Span></p>
		    	<p><Span>Congratulations and thank you for registering for the {race_name}!</Span></p>
		    	<p style={{lineHeight: '150%'}}><Span>Your registration confirms that you have agreed to the Rules and Regulations of {race_name} as stipulated by the Organiser.</Span></p>
		      <p style={{lineHeight: '150%'}}><Span>You may access your user dashboard at <A href="https://web.42race.com/my-account"> https://web.42race.com/dashboard </A> to manage your account details.</Span></p>		    
	    	<hr/>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Price: {showCurrency}{price.toFixed(2)}</Span><br/>
			    	<Span>Participant Name: {name} & {partner.profile.name}</Span><br/>
			    	<Span>Email: {email}</Span><br/>		

			    	{/* only for PA orders */}	
			    	<Span>Medals can be collected at the Community Clubs/Centres and time selected during your registration</Span> <br/>
			    	<Span>Your medal collection point: {collection1}</Span> <br/>
			    	<Span>Your partner's medal collection point: {collection2}</Span>
			    	{/* <Span>Address: <br/>{address} <br/>{address2} {unit_number}</Span><br/>	
			    	<Span>Country: {country}</Span><br/>	
			    	<Span>Postal: {postal}</Span><br/> */}
			    	{(medal_engraving) && (medal_engraving !== '') ? <Span>Medal Engraving: {medal_engraving} <br/></Span> : <Span/>}
			    	{(addOn && (addOn !== '') ) ? <Span>Add On: <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
			    	
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>
				<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} />
	    	<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

export const OrderEmailToUserWithBuddy = (currentUser, values, raceData, orderTimestamp, orderNum, partner) => {		
  return renderEmail( <OrderEmailToUserWithBuddyTemplate   											
  											currentUser={currentUser}
  											partner={partner}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );  											
};


// send email to user's partner template for buddy runs
const OrderEmailToBuddyTemplate = ({currentUser, values, raceData, orderTimestamp, orderNum, partner}) => { 
	const { 
		address, address2, country, postal, unit_number, email, 
		price, currency, category, medal_engraving, addOn
	} = values;	
	let { race_name, start_date, end_date } = raceData;
	const { profile } = currentUser;	
	const { name } = profile;
	
	let showCurrency = '$';
	if(currency == 'myr') {
		showCurrency = 'RM';
 	} 

 	// only for PA order
 	let { collection1, collection2 } = values;
 	
  return (
	  <Email title={race_name + ' customer order'} headCSS={css}>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Thank you for your Order</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>
	  		<h3><Span fontSize={26}><strong>Welcome to {race_name}</strong></Span></h3>
		    	<p><Span fontSize={18}><strong>Dear {partner.profile.name},</strong></Span></p>
		    	<p><Span>Congratulations and thank you for registering for the {raceData.race_name}! {name} has registered for you to run together in this exciting race.</Span></p>
		    	<p style={{lineHeight: '150%'}}><Span>Your registration confirms that you have agreed to the Rules and Regulations of {race_name} as stipulated by the Organiser.</Span></p>
		      <p style={{lineHeight: '150%'}}><Span>You may access your user dashboard at <A href="https://web.42race.com/my-account"> https://web.42race.com/dashboard </A> to manage your account details.</Span></p>		    
	    	<hr/>
	    	<h3><strong><Span fontSize={26}>Order Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		<Span>Order Number: #{orderNum}</Span><br/>
		    		<Span>Participant Name: {partner.profile.name} & {name}</Span><br/>

			    	{/* only for PA orders */}	
			    	<Span>Medals can be collected at the Community Clubs/Centres selected during your registration</Span> <br/>
			    	<Span>Your medal collection point: {collection2}</Span> <br/>
			    	<Span>Your partner's medal collection point: {collection1}</Span>    	
			    	{/* <Span>Address: <br/>{address} <br/>{address2} {unit_number}</Span><br/>	
			    	<Span>Country: {country}</Span><br/>	
			    	<Span>Postal: {postal}</Span><br/> */}	

			    	{(medal_engraving) && (medal_engraving !== '') ? <Span>Medal Engraving: {medal_engraving} <br/></Span> : <Span/>}
			    	{(addOn && (addOn !== '') ) ? <Span>Add On: <span style={{'whiteSpace':'pre'}}>{addOn}</span> <br/></Span> : <Span/>}
			    	
		    	</p>
				<hr/>
	    	<h3><strong><Span fontSize={26}>Race Details</Span></strong></h3>
				<RaceDetails race_name={race_name}
										 race_start_date={start_date}
										 race_end_date={end_date}
									   category={category} />
	    	<br/>

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <Footer />
		    </Item>
	    </Box>

	  </Email>
  )
};

export const OrderEmailToBuddy = (currentUser, values, raceData, orderTimestamp, orderNum, partner) => {		
  return renderEmail( <OrderEmailToBuddyTemplate   											
  											currentUser={currentUser}
  											partner={partner}
  											values={values}
  											raceData={raceData}  											
  											orderTimestamp={orderTimestamp}
  											orderNum={orderNum}	/> );  											
};