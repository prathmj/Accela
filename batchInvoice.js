// JavaScript source code
/*
	Global constants for adding fees to Litter and Vegetation records
*/
var wfTask = "Case Closed";
var processName = "";
var wfStatus = "Open for Collections";
var capResult = aa.cap.getByAppType("Enforcement", "Violations", "Environmental", null);
var capToAddFee = new Array();
var capObject = new Array();
var fromEmail = "noreply@accela.com";
var toEmail = "rcasiano@southbendin.gov";
var emailSubject = "Batch invoicing of litter and vegetation records complete";
var emailText = "The batch invoicing job has completed. The following ";
var ccEmail = "";
var invoiceCount = 0;
var emailRecords = "<br>";

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
aa.print("Starting script");
aa.print("<br>");

if (capResult.getSuccess()) {
    capArray = capResult.getOutput();

    for (x in capArray) {
        // Assign a friendly variable name to avoid typing .getCapID() multiple times
        capObject[x] = capArray[x].getCapID();

        if (capArray[x].getCapType() != "Enforcement/Violations/Environmental/Grass and Weeds" && capArray[x].getCapType() != "Enforcement/Violations/Environmental/Graffiti") {
            // Branch the records returned into Grass and !Grass records
            var workflowResult = aa.workflow.getTaskItems(capObject[x], wfTask, processName, null, wfStatus, "Y");
            var wfObj = workflowResult.getOutput();

            //This statement checks if the request succeeded and if the request returned any data AND if the record has any existing fees on it
            if (workflowResult.getSuccess() && wfObj.length > 0 && feeAmountExcept(capObject[x]) == 0) {
                var feeSeqArray = [];
                aa.print("<br>");
                aa.print("<br>");
                aa.print("Invoicing for " + capObject[x].getCustomID() + ".");
                aa.print("<br>");
                aa.print("<br>");

                invoiceCount += 1;

                //Setting all of the ASI fields to variables to perform logic and/or operations on them
                var numTires = getAppSpecific("Number of Tires", capObject[x]);
                var dumpLoad = getAppSpecific("Load", capObject[x]);
                var dumpFees = getAppSpecific("Weight (ton)", capObject[x]);
                var numCrew = getAppSpecific("Number of Crew", capObject[x]);
                var time = getAppSpecific("Time Spent (hrs)", capObject[x]);
                var dumpTruck = getAppSpecific("Dump Truck and Small Loader", capObject[x]);
                var lightningLoader = getAppSpecific("Lightning Loader", capObject[x]);
                var pickupTruck = getAppSpecific("Pickup Truck", capObject[x]);
                var rollTruck = getAppSpecific("Roll Off Truck", capObject[x]);

                //Data validation check for ASI fields
                /*
				aa.print("<br>");
				aa.print("time = "+time);
				aa.print("numCrew = "+numCrew);
				aa.print("dumpLoad = "+dumpLoad);
				aa.print("dumpFees = "+dumpFees);
				aa.print("numTires = "+numTires);
				aa.print("dumpTruck = "+dumpTruck);
				aa.print("lightningLoader = "+lightningLoader);
				aa.print("pickupTruck = "+pickupTruck);
				aa.print("rollTruck = "+rollTruck);
				*/

                if (numCrew < 1 || numCrew == null) {
                    numCrew = 1;
                }
                if (time == null || time == 0) {
                    time = 0.25;
                }
                if (time < 0.5) {
                    equipTime = 0.5;
                }
                if (time >= 0.5) {
                    equipTime = time;
                }
                /*
				aa.print("<br>");
				aa.print("time = "+time);
				aa.print("numCrew = "+numCrew);
				aa.print("dumpLoad = "+dumpLoad);
				aa.print("dumpFees = "+dumpFees);
				aa.print("numTires = "+numTires);
				aa.print("dumpTruck = "+dumpTruck);
				aa.print("lightningLoader = "+lightningLoader);
				aa.print("pickupTruck = "+pickupTruck);
				aa.print("rollTruck = "+rollTruck);
				aa.print("equipTime = "+equipTime);
				*/

                //Calculation of charges
                var laborCharge = numCrew * time;
                var adminCost = 1;
                var inspFees = 1;

                //Adding fees
                if (dumpTruck == "CHECKED") {
                    feeSeqArray.push(addFee("ILLEGAL 30", "ENF_ENVIRONMENTAL", "FINAL", equipTime, "N", capObject[x]));
                    aa.print("Successfully added dump truck fee for " + equipTime + " hours.");
                    aa.print("<br>");
                }
                if (lightningLoader == "CHECKED") {
                    feeSeqArray.push(addFee("ILLEGAL 50", "ENF_ENVIRONMENTAL", "FINAL", equipTime, "N", capObject[x]));
                    aa.print("Successfully added lightning loader fee for " + equipTime + " hours.");
                    aa.print("<br>");
                }
                if (pickupTruck == "CHECKED") {
                    feeSeqArray.push(addFee("ILLEGAL 70", "ENF_ENVIRONMENTAL", "FINAL", equipTime, "N", capObject[x]));
                    aa.print("Successfully added pickup truck fee for " + equipTime + " hours.");
                    aa.print("<br>");
                }
                if (rollTruck == "CHECKED") {
                    feeSeqArray.push(addFee("ILLEGAL 80", "ENF_ENVIRONMENTAL", "FINAL", equipTime, "N", capObject[x]));
                    aa.print("Successfully added roll truck fee for " + equipTime + " hours.");
                    aa.print("<br>");
                }
                if (numTires > 0) {
                    feeSeqArray.push(addFee("ILLEGAL 85", "ENF_ENVIRONMENTAL", "FINAL", numTires, "N", capObject[x]));
                    aa.print("Successfully added tire fee for " + numTires + " tires.");
                    aa.print("<br>");
                }
                if (dumpLoad > 0) {
                    feeSeqArray.push(addFee("ILLEGAL 90", "ENF_ENVIRONMENTAL", "FINAL", dumpLoad, "N", capObject[x]));
                    aa.print("Successfully added dump load fee for " + dumpLoad + " load(s).");
                    aa.print("<br>");
                }
                if (dumpFees > 0) {
                    feeSeqArray.push(addFee("ILLEGAL 95", "ENF_ENVIRONMENTAL", "FINAL", dumpFees, "N", capObject[x]));
                    aa.print("Successfully added dump fee for " + dumpFees + " ton(s).");
                    aa.print("<br>");
                }

                //Always add admin, labor, and inspection fees
                feeSeqArray.push(addFee("ILLEGAL 110", "ENF_ENVIRONMENTAL", "FINAL", adminCost, "N", capObject[x]));
                aa.print("Successfully added admin cost.");
                aa.print("<br>");
                feeSeqArray.push(addFee("ILLEGAL 30", "ENF_ENVIRONMENTAL", "FINAL", laborCharge, "N", capObject[x]));
                aa.print("Successfully added labor charge. This is " + numCrew + " crew member(s) for " + time + " hours.");
                aa.print("<br>");
                feeSeqArray.push(addFee("ILLEGAL 100", "ENF_ENVIRONMENTAL", "FINAL", inspFees, "N", capObject[x]));
                aa.print("Successfully added inspection fee cost.");
                aa.print("<br>");


                aa.print("<br>");
                var emailAddress = aa.address.getAddressByCapId(capObject[x]).getOutput();
                var paymentPeriodArray = [];

                for (var i = 0; i < feeSeqArray.length; i++) {
                    paymentPeriodArray.push("FINAL");

                    if (feeSeqArray[i] == null) {
                        aa.print("I am null. I am not an object");
                        aa.print("<br>");
                    }
                }

                var invoiceOutcome = aa.finance.createInvoice(capObject[x], feeSeqArray, paymentPeriodArray);
                var invoiceObjects = invoiceOutcome.getOutput();

                if (invoiceOutcome.getSuccess()) {
                    var testInvoice = aa.finance.getInvoiceByCapID(capObject[x], null).getOutput();
                    var invNumber = testInvoice[0].invNbr;
                    var testObject = aa.finance.getFeeItemInvoiceByInvoiceNbr(capObject[x], invNumber, null).getOutput();


                    aa.print(feeSeqArray.length + " fees were added to this record under invoice number " + testInvoice[0].invNbr);
                    aa.print("<br>");

                    for (yy in testObject) {
                        aa.print("<br>");
                        aa.print(testObject[yy].getFeeDescription() + " was billed for $" + testObject[yy].fee + " under invoice number " + testObject[yy].invoiceNbr);
                    }

                    emailRecords += "<br>" + capObject[x].getCustomID() + "  :  " + emailAddress[0] + "  :  Inv. # " + invNumber + "<br>";
                }
                else {
                    aa.print("Invoice getSuccess() && length checks didn't work");
                }
            }
        }
    }

    if (invoiceCount == 0) {
        emailText = "The batch invoicing job has completed, but there were no records to invoice." + "<br><br>" + "Please check that this is correct by verifying that there are no litter or vegetation records that are in the Case Closed task with a task status of Open for Collections.";

    } else if (invoiceCount != 0) {
        emailText += invoiceCount + " records were invoiced:" + emailRecords;
    }

    aa.sendMail(fromEmail, toEmail, ccEmail, emailSubject, emailText);
    aa.print("<br>");
    aa.print(invoiceCount + " total records were invoiced");
    aa.print("<br>");
    aa.print("<br>");
    aa.print("Email sent to " + toEmail);
}
else {
    aa.print("The capResult returned an error.");
}

/*
Extra functions needed to debug or call other Accela scripts
*/

function getScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

function debugObject(object) {
    var output = '';
    for (property in object) {
        output += "<font color=red>" + property + "</font>" + ': ' + "<br><bold>" + object[property] + "</bold>" + '; ' + "<BR>";
    }
    aa.print(output);
}