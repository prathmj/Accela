// JavaScript source code
/*
	Call the Master Scripts
*/
var SCRIPT_VERSION = 2.0;
eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

var allAddresses = aa.address.getAddressListForAdmin(null, null, null, null, null, null, null, null, null, null, null, null, null, null);

if (allAddresses.getSuccess()) {
    var allAddressesObjects = allAddresses.getOutput();
    for (addressObject in allAddressesObjects){
        var refid = allAddressesObjects[addressObject].refAddressModel.getRefAddressId();
        aa.print(refid)
    }
}

aa.print("Lucy Smells" + Object.keys(allAddressesObjects).length);

function getCAPConditions(pType, pStatus, pDesc, pImpact) // optional capID
{
    var resultArray = new Array();
    var lang = "en_US";

    var bizDomainModel4Lang = aa.bizDomain.getBizDomainByValue("I18N_SETTINGS", "I18N_DEFAULT_LANGUAGE");
    if (bizDomainModel4Lang.getSuccess())
        lang = bizDomainModel4Lang.getOutput().getDescription();

    if (arguments.length > 4)
        var itemCap = arguments[4]; // use cap ID specified in args
    else
        var itemCap = capId;

    ////////////////////////////////////////
    // Check Records
    ////////////////////////////////////////

    if (pType == null)
        var condResult = aa.capCondition.getCapConditions(itemCap);
    else
        var condResult = aa.capCondition.getCapConditions(itemCap, pType);

    if (condResult.getSuccess())
        var capConds = condResult.getOutput();
    else {
        var capConds = new Array();
        logDebug("**WARNING: getting cap conditions: " + condResult.getErrorMessage());
    }

    var cStatus;
    var cDesc;
    var cImpact;

    for (cc in capConds) {
        var thisCond = capConds[cc];
        var cStatus = thisCond.getConditionStatus();
        var cDesc = thisCond.getConditionDescription();
        var cImpact = thisCond.getImpactCode();
        var cType = thisCond.getConditionType();
        var cComment = thisCond.getConditionComment();
        var cExpireDate = thisCond.getExpireDate();

        if (cStatus == null)
            cStatus = " ";
        if (cDesc == null)
            cDesc = " ";
        if (cImpact == null)
            cImpact = " ";
        //Look for matching condition

        if ((pStatus == null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc == null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact == null || pImpact.toUpperCase().equals(cImpact.toUpperCase()))) {
            var r = new condMatchObj;
            r.objType = "Record";
            r.object = thisCond;
            r.status = cStatus;
            r.type = cType;
            r.impact = cImpact;
            r.description = cDesc;
            r.comment = cComment;
            r.expireDate = cExpireDate;

            var langCond = aa.condition.getCondition(thisCond, lang).getOutput();
            if (langCond != null) {
                r.arObject = langCond;
                r.arDescription = langCond.getResConditionDescription();
                r.arComment = langCond.getResConditionComment();
            }
            else {
                r.arObject = null;
                r.arDescription = null;
                r.arComment = null;
            }
            resultArray.push(r);
        }
    }

    return resultArray;
}

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
