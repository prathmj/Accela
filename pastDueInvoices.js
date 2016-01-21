/*
	Global constants for adding fees to Litter and Vegetation records
*/

var capResult = aa.cap.getByAppType("Enforcement","Violations","Environmental",null);
var capObject = new Array();
var unpaidInvObjArray = new Array();
var unpaidInvNbrs = new Array();
var todayDate = new Date();
var dontWant = new Array(null,""," ");
/*
	Call the Master Scripts
*/
var SCRIPT_VERSION = 2.0
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));
/*
	Object declaration
*/
var invObject = function(invModelObj,jsInvDate,payment){
	this.invModelObj = invModelObj;
	this.jsInvDate = jsInvDate;
	this.addCapID = function(capID)
	{
		this.capID = capID
	}
	this.addPayment = function(payment)
	{
		this.payment = payment;
	}
	this.addOwner1 = function(owner)
	{
		this.owner1 = owner
	}
	this.addOwner2 = function(owner)
	{
		this.owner2 = owner
	}
	this.addOwnerAddr1 = function(numStreet,city,state,zip)
	{
		this.ownerAddr1NumStreet = numStreet;
		this.ownerAddr1City = city;
		this.ownerAddr1State = state;
		this.ownerAddr1Zip = zip;
	}
	this.addOwnerAddr2 = function(numStreet,city,state,zip)
	{
		this.ownerAddr2NumStreet = numStreet;
		this.ownerAddr2City = city;
		this.ownerAddr2State = state;
		this.ownerAddr2Zip = zip;
	}
	this.addPropAddr = function(num,fullStreet,city,state,zip)
	{
		this.propAddrNum = num;
		this.propAddrFullStreet = fullStreet;
		this.propAddrCity = city;
		this.propAddrState = state;
		this.propAddrZip = zip;
	}
	this.addInvDept = function(dept)
	{
		this.dept = dept
	}
}

/*
	Main logic start
*/

if(unpaidInvObj = aa.invoice.getUnpaidInvoices().getSuccess())
{
	var unpaidInvObj = aa.invoice.getUnpaidInvoices().getOutput();
	for (x in unpaidInvObj)
	{
		invModel = unpaidInvObj[x].getInvoiceModel();
		var invDateSplit = invModel.getInvDate().toString().split(" ");
		var invDateList = invDateSplit[0].split("-")
		var invDate = new Date(invDateList[0],invDateList[1]-1,invDateList[2])
		
		if(Math.ceil((todayDate-invDate)/(1000*3600*24))> 30)
		{
			unpaidInvObjArray.push(new invObject(invModel,invDate))
			unpaidInvNbrs.push(invModel.getInvNbr())
		}
	}
}
else
{
	aa.print("Something went wrong with aa.invoice.getUnpaidInvoices()")
}

if (capResult.getSuccess())
{
	capArray = capResult.getOutput();

	for(x in capArray)
	{
		// Assign a friendly variable name to avoid typing .getCapID() multiple times
		capObject[x] = capArray[x].getCapID();
		
		var invoiceResult = aa.finance.getInvoiceByCapID(capObject[x],null);
		var paymentResult = aa.finance.getPaymentByCapID(capObject[x],null);
		var ownResult = aa.owner.getOwnerByCapId(capObject[x]);
		var addrResult = aa.address.getAddressByCapId(capObject[x]);
		
		// Statement to see if cap has invoice and if that invoice is in the unpaidInvoices result
		if(invoiceResult.getSuccess())
		{
			invoiceArray = invoiceResult.getOutput()
			
			for(y in invoiceArray)
			{
			var position = unpaidInvNbrs.indexOf(invoiceArray[y].getInvNbr())
				if ( position != -1)
				{
					unpaidInvObjArray[position].addCapID(capObject[x])
					var feeResult = aa.finance.getFeeItemInvoiceByInvoiceNbr(capObject[x],invoiceArray[y].getInvNbr(),null);
					
					// Statements to see if an invoice is OVB
					if(feeResult.getSuccess())
					{
						feeArray = feeResult.getOutput();
						for (fee in feeArray)
						{
							if((feeArray[fee].getFeeCode() == "GRASS 27" || feeArray[fee].getFeeCode() == "SNOW 1") && 
							Object.keys(feeArray).length == 1)
							{
								unpaidInvObjArray[position].addInvDept("OVB")
							}
							else if((feeArray[fee].getFeeCode() == "GRASS 27" || feeArray[fee].getFeeCode() == "SNOW 1") && 
							Object.keys(feeArray).length != 1)
							{
								unpaidInvObjArray[position].addInvDept("OVB/Code")
							}
							else
							{
								unpaidInvObjArray[position].addInvDept("Code")
							}
						}
						
					}
					else
					{
						aa.print("Something went wrong with aa.finance.getFeeItemInvoiceByInvoiceNbr().getSuccess()")
					}
					
					// Statements to correctly build address information
					if(addrResult.getSuccess())
					{
						addrArray = addrResult.getOutput();
						if(Object.keys(addrArray).length == 0)
						{
							unpaidInvObjArray[position].addPropAddr("","","","","");
						}
						else
						{
							for(addr in addrArray)
							{
								if(dontWant.indexOf(addrArray[addr].getHouseFractionStart()) == -1)
								{
									var propNum = addrArray[addr].getHouseNumberStart()+" "+addrArray[addr].getHouseFractionStart();
								}
								else
								{
									var propNum = addrArray[addr].getHouseNumberStart();
								}
						
								var addr1 = ""
								
								if(dontWant.indexOf(addrArray[addr].getStreetDirection()) == -1)
								{
									addr1 += addrArray[addr].getStreetDirection() +" ";
								}
								
								if(dontWant.indexOf(addrArray[addr].getStreetPrefix()) == -1)
								{
									addr1 += addrArray[addr].getStreetPrefix()+" ";
								}
								
								addr1 += addrArray[addr].getStreetName() + " ";
								
								if(dontWant.indexOf(addrArray[addr].getStreetSuffix()) == -1)
								{
									addr1 += addrArray[addr].getStreetSuffix() + " ";
								}
								
								if(dontWant.indexOf(addrArray[addr].getStreetSuffixdirection()) == -1)
								{
									addr1 += addrArray[addr].getStreetSuffixdirection();
								}
								
								unpaidInvObjArray[position].addPropAddr(propNum,addr1,addrArray[addr].getCity(),addrArray[addr].getState(),addrArray[addr].getZip())
							}
						}
					}
					else
					{
						aa.print("Something went wrong with aa.address.getAddressByCapId().getSuccess()")
					}
					// Statements to see if payments currently exist on the RECORD, not just the invoice
					if(paymentResult.getSuccess())
					{
						var paymentArray = paymentResult.getOutput()
						unpaidInvObjArray[position].addPayment(Object.keys(paymentArray).length)
					}
					else
					{
						aa.print("Something went wrong with aa.finance.getPaymentByCapID().getSuccess()")
					}
					
					// Statements to correctly grab owner name and address information
					if (ownResult.getSuccess())
					{
						var ownArray = aa.owner.getOwnerByCapId(capObject[x]).getOutput();
						if(Object.keys(ownArray).length == 0)
						{
							unpaidInvObjArray[position].addOwner1("")
							unpaidInvObjArray[position].addOwnerAddr1("","","","")
							unpaidInvObjArray[position].addOwner2("")
							unpaidInvObjArray[position].addOwnerAddr2("","","","")
						}
						else
						{
							unpaidInvObjArray[position].addOwner1(ownArray[0].getOwnerFullName())
							unpaidInvObjArray[position].addOwnerAddr1(ownArray[0].getMailAddress1(),ownArray[0].getMailCity(),
							ownArray[0].getMailState(),ownArray[0].getMailZip())
							unpaidInvObjArray[position].addOwner2("")
							unpaidInvObjArray[position].addOwnerAddr2("","","","")
	
							for(z in ownArray)
							{
								if(String(ownArray[z].getOwnerFullName()) != String(ownArray[0].getOwnerFullName()))
								{
									unpaidInvObjArray[position].addOwner2(ownArray[z].getOwnerFullName())
								}
								if(String(ownArray[z].getMailAddress1()+","+ownArray[z].getMailCity()+
									","+ownArray[z].getMailState()+","+ownArray[z].getMailZip()) != String(ownArray[0].getMailAddress1()+","+ownArray[0].getMailCity()+
									","+ownArray[0].getMailState()+","+ownArray[0].getMailZip()))
								{
									unpaidInvObjArray[position].addOwnerAddr2(ownArray[z].getMailAddress1(),ownArray[z].getMailCity(),
									ownArray[z].getMailState(),ownArray[z].getMailZip())
								}
							
							}
						}
					}
					else
					{
						aa.print("Something went wrong with aa.owner.getOwnerByCapId().getSuccess()")
					}
				} 
			}
		}
		else
		{
			aa.print("Something went wrong with aa.finance.getInvoiceByCapID().getSuccess()")
		}
	}
}
else
{
	aa.print("The capResult returned an error.");
}


aa.print("Record|PaymentsOnRec|InvNumber|Dept|InvBalanceDue|InvAmount|DaysOutstanding|InvDueDate|InvDate|Owner1|MailAddr1|"+
"MailCity1|MailState1|MailZip1|PropNum|PropSt|PropCity|PropState|PropZip|Owner2|MailAddr2|MailCity2|MailState2|MailZip2");
for (x in unpaidInvObjArray){
		aa.print(unpaidInvObjArray[x].capID.getCustomID()+"|"+unpaidInvObjArray[x].payment+"|"+unpaidInvObjArray[x].invModelObj.getInvNbr()+"|"+
		unpaidInvObjArray[x].dept+"|"+unpaidInvObjArray[x].invModelObj.getBalanceDue()+"|"+unpaidInvObjArray[x].invModelObj.getInvAmount()+"|"+
		Math.ceil((todayDate-unpaidInvObjArray[x].jsInvDate)/(1000*3600*24))+"|"+unpaidInvObjArray[x].invModelObj.getInvDueDate()+"|"+
		unpaidInvObjArray[x].invModelObj.getInvDate()+"|"+unpaidInvObjArray[x].owner1+"|"+unpaidInvObjArray[x].ownerAddr1NumStreet+"|"+
		unpaidInvObjArray[x].ownerAddr1City+"|"+unpaidInvObjArray[x].ownerAddr1State+"|"+unpaidInvObjArray[x].ownerAddr1Zip+"|"+
		unpaidInvObjArray[x].propAddrNum+"|"+unpaidInvObjArray[x].propAddrFullStreet+"|"+unpaidInvObjArray[x].propAddrCity+"|"+unpaidInvObjArray[x].propAddrState+"|"+
		unpaidInvObjArray[x].propAddrZip+"|"+unpaidInvObjArray[x].owner2+"|"+unpaidInvObjArray[x].ownerAddr2NumStreet+"|"+
		unpaidInvObjArray[x].ownerAddr2City+"|"+unpaidInvObjArray[x].ownerAddr2State+"|"+unpaidInvObjArray[x].ownerAddr2Zip)
}

/*
Extra functions needed to debug or call other Accela scripts
*/
function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

function debugObject(object)
{
var output = ''; 
 for (property in object) { 
   output += "<font color=red>" + property + "</font>" + ': ' + "<br><bold>" + object[property] + "</bold>" +'; ' + "<BR>"; 
 } 
 aa.print(output);
}
