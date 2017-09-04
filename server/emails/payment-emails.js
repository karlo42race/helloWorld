import React from 'react';
import ReactHTMLEmail, { Box, Email, Item, Span, renderEmail, A, Image } from 'react-html-email';

// set up React to support a few HTML attributes useful for legacy clients 
ReactHTMLEmail.injectReactEmailAttributes()

const css = `
@media only screen and (max-device-width: 480px) {
  font-size: 20px !important;
}
.white-space-pre {
   white-space: pre-wrap;
}`.trim()


// send to USER
const PaymentEmailToUserTemplate = function({name, company, phone, email, invoice_num, currency, amount, notes, timeStamp}) { 
	
	let showCurrency = '$';
	if (currency == 'myr') {
		showCurrency = 'RM';
 	} 

  return (
	  <Email title={'Payments: customer copy'} headCSS={css}>
	  	<Box cellSpacing={30} width="100%" backgroundColor="gray" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Thank you for your Payment</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>	  		
	    	<p><Span fontSize={18}><strong>Dear {name},</strong></Span></p>
	    	<p style={{lineHeight: '150%'}}><Span>Thank you for your payment. The payment details are as follows:</Span></p>
	    	<p style={{lineHeight: '150%'}}>
	    	{(invoice_num !== '') ? 
		    		<Span>Invoice Number: #{invoice_num}<br/></Span> : <Span></Span> }
		    		<Span>Amount: {showCurrency}{amount}</Span><br/>
		    		<Span>Name: {name}</Span><br/>
		    		<Span>Company: {company}</Span><br/>
			    	<Span>Email: {email}</Span><br/>			    	
			    	<Span>Phone: {phone}</Span><br/>
			    	<Span>Payment Date: {moment(timeStamp).format('DD MMM YYYY, h:mm:ss a')}</Span><br/>
			    	<Span>Notes: {notes}</Span><br/>			    	
		    	</p>
				<hr/>	    	

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <p style={{lineHeight: '150%'}}>
		    	<Span color="gray">Email: contact@42race.com</Span><br/>
		    	<Span color="gray">Website: <A href="www.42race.com"> www.42race.com </A> </Span><br/>
		    	<Span color="gray">Facebook: <A href="https://www.facebook.com/42race/"> https://www.facebook.com/42race/ </A></Span><br/>		    	
	    	</p>
		    </Item>
	    </Box>

	  </Email>
  )
};

export const PaymentEmailToUser = function(options, timeStamp){
  return renderEmail(<PaymentEmailToUserTemplate 
  											name={options.name}				
												company={options.company} 
												phone={options.phone} 
												email={options.email} 
												invoice_num={options.invoice_num} 
												currency={options.currency} 
												amount={options.amount} 
												notes={options.notes} 
												timeStamp={timeStamp}	/>);    											 
}


// send to ADMIN
// order email to user with product addon
const PaymentEmailToAdminTemplate = function({name, company, phone, email, invoice_num, currency, amount, notes, timeStamp}) { 
	
	let showCurrency = '$';
	if (currency == 'myr') {
		showCurrency = 'RM';
 	} 
  return (
	  <Email title="Payment" headCSS={css}>
	  	<Box cellSpacing={30} width="100%" backgroundColor="gray" style={{backgroundColor:'#1D1D1D'}}><Item><Span color="white" fontSize={26}>Payment from {name}</Span></Item></Box>
	  	<Box cellSpacing={30} width="100%" style={{backgroundColor:'#F5F5F5'}}>
	  	<Item>	  		
	    	<h3><strong><Span fontSize={26}>Payment Details</Span></strong></h3>	    	
		    	<p style={{lineHeight: '150%'}}>
		    		{(invoice_num !== '') ? 
		    		<Span>Invoice Number: #{invoice_num}<br/></Span> : <Span></Span> }
		    		<Span>Amount: {showCurrency}{amount}</Span><br/>
		    		<Span>Name: {name}</Span><br/>
		    		<Span>Company: {company}</Span><br/>
			    	<Span>Email: {email}</Span><br/>			    	
			    	<Span>Phone: {phone}</Span><br/>
			    	<Span>Payment Date: {moment(timeStamp).format('DD MMM YYYY, h:mm:ss a')}</Span><br/>
			    	<Span>Notes: {notes}</Span><br/>			    	
		    	</p>
				<hr/>	    	

		    <p style={{lineHeight: '150%'}}><strong><Span>Cheers, </Span><br/>
		    <Span>42Race Team</Span></strong></p>
		    <p style={{lineHeight: '150%'}}>
		    	<Span color="gray">Email: contact@42race.com</Span><br/>
		    	<Span color="gray">Website: <A href="www.42race.com"> www.42race.com </A> </Span><br/>
		    	<Span color="gray">Facebook: <A href="https://www.facebook.com/42race/"> https://www.facebook.com/42race/ </A></Span><br/>		    	
		    	</p>
		    </Item>
	    </Box>

	  </Email>
  )
};

export const PaymentEmailToAdmin = function(options, timeStamp){
  return renderEmail(<PaymentEmailToAdminTemplate 
  											name={options.name}				
												company={options.company} 
												phone={options.phone} 
												email={options.email} 
												invoice_num={options.invoice_num} 
												currency={options.currency} 
												amount={options.amount} 
												notes={options.notes} 
												timeStamp={timeStamp}	/>);  											
}
