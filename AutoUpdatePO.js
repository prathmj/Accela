/*
	Global constants for adding fees to Litter and Vegetation records
*/
var wfTask = "Case Closed"; //"Case Closed";
var processName = "";
var wfStatus = "Closed"; //"Open for Collections";
var capToUpdate = new Array();
var capObject = new Array();
var capResult = aa.cap.getByAppType("Enforcement","Violations");
var parcels = new Array();
var owners = new Array();
var addresses = new Array();

/*
	Call the Master Scripts
*/
var SCRIPT_VERSION = 2.0
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));


/*
	Main logic start
*/

if (capResult.getSuccess())
{
	capArray = capResult.getOutput();
	capArray_NotClosed = capArray;
    aa.print("There are "+capArray_NotClosed.length+" not closed records.");
	
	for(x in capArray)
	{
		// Assign a friendly variable name to avoid typing .getCapID() multiple times
		capObject[x] = capArray[x].getCapID();
		
		// Branch the records returned into Closed and !Closed records
		var workflowResult = aa.workflow.getTaskItems(capObject[x],wfTask,processName,null,wfStatus,"Y"); //This is the opposite of what I want
		var wfObj = workflowResult.getOutput();
			
		//This statement checks if the request succeeded and if the request returned any data AND if the record has any existing fees on it
		if (workflowResult.getSuccess() && wfObj.length > 0 )
		{
			//Remove Closed From NotClosed Array
			var index = capArray[x];
			capArray_NotClosed.splice(index,1);
			aa.print("");
			aa.print("Violation closed: "+capObject[x].getCustomID()+".");
		}
	}
	//Print number of caps to Determine if any were Closed
	aa.print(capArray_NotClosed.length);
	aa.print("")
	
	// All of the CAPS !(Closed && Case Closed)
	for(x in capArray_NotClosed){
		
		aa.print("----------------------------------------------------------------")
		
		// Get The CapID
		capToUpdate[x] = capArray_NotClosed[x].getCapID();
		aa.print(capToUpdate[x].getCustomID());
		aa.print(capArray_NotClosed[x].getCapType());
		var allParcels = aa.parcel.getParcelDailyByCapID(capToUpdate[x],null).getOutput();
		
		for (y in allParcels){
			var prclObj = aa.parcel.getParceListForAdmin(allParcels[y].getParcelNumber(), null, null, null, null, null, null, null, null, null);
			if (prclObj.getSuccess() )
	        {
		        var prclArr = prclObj.getOutput();
		        if (prclArr.length)
		        {
			        var prcl = prclArr[0].getParcelModel();
					//debugObject(prcl);
			        var refParcelNumber = prcl.getParcelNumber();
					var legalDesc = prcl.getLegalDesc();
					aa.print("Parcel # "+refParcelNumber);
					aa.print("Legal desc: "+legalDesc);
				}
			}
		}
		
		var capOwnerArr = aa.owner.getParcelOwnersByCap(capToUpdate[x]);
		
		if(capOwnerArr.getSuccess()){
			aa.print ("Success");
			var capObject = capOwnerArr.getOutput();
			
			for (z in capObject){
				if(capObject[z].getPrimaryOwner() == 'Y'){
					//Double check in updateRefParcleToCap if the parcel # is analogous to the ownerNumber defined below
					
					var capOwner = capObject[z];
					debugObject(capOwner);
					//var ownerNumber = capOwner.getL1OwnerNumber();
					//aa.print("Owner number is "+ownerNumber);
					capOwner.setCapID(capToUpdate[x]);
					//aa.owner.updateDailyOwnerWithAPOAttribute(capOwner);
					aa.owner.createCapOwnerWithAPOAttribute(capOwner);
					aa.print("Updated owner information");
				}
			}
		} else {
		
			aa.print(capOwnerArr.getErrorMessage());
		}
		
		var capOwnerArrTest = aa.owner.getParcelOwnersByCap(capToUpdate[x]).getOutput();
		debugObject(capOwnerArrTest[0]);
		
		//Update parcel information to the CAP
		//updateRefParcelToCap(capToUpdate[x]);
		
		//aa.print("Updated parcel info");
		
	}

}
else
{
	aa.print("The capResult returned an error.");
}

/*
Accela master function, modified functions, and custom functions
*/
function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

/*
function debugObject(object)
{
var output = '';
var funclist = [];
 for (property in object) { 
   funclist.push(property)
 }
 funclist.sort()
 for (x in funclist){
   output += funclist[x] + ":\r"+ object[funclist[x]] + "\r"; 
 } 
 aa.print(output);
}
*/
function debugObject(object) {
    var output = '';
    for (property in object) {
        output += "<font color=red>" + property + "</font>" + ': ' + "<br><bold>" + object[property] + "</bold>" + '; ' + "<BR>";
    }
    aa.print(output);
	}
