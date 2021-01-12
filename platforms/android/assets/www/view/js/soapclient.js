/*****************************************************************************\

 Javascript "SOAP Client" library
 
 @version: 2.4.1 - 2007.12.21
 @author: Matteo Casati - http://www.guru4.net/
 @modify: NDRS-kjn
 
\*****************************************************************************/

function SOAPClientParameters()
{
	var _pl = new Array();
	this.add = function(name, value) 
	{
		_pl[name] = value; 
		return this; 
	}
	this.toXml = function()
	{
		var xml = "";
		for(var p in _pl)
		{
			//alert(typeof(_pl[p]));
			switch(typeof(_pl[p])) 
			{
                case "string":
                case "number":
                case "boolean":
                case "object":
                    xml += "<ns1:" + p + ">" + SOAPClientParameters._serialize(_pl[p]) + "</ns1:" + p + ">";
                    break;
                default:
                    break;
            }
		}
		return xml;	
	}
}
SOAPClientParameters._serialize = function(o)
{
    var s = "";
    switch(typeof(o))
    {
        case "string":
            s += o.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); break;
        case "number":
        case "boolean":
            s += o.toString(); break;
        case "object":
            // Date
            if(o.constructor.toString().indexOf("function Date()") > -1)
            {
        
                var year = o.getFullYear().toString();
                var month = (o.getMonth() + 1).toString(); month = (month.length == 1) ? "0" + month : month;
                var date = o.getDate().toString(); date = (date.length == 1) ? "0" + date : date;
                var hours = o.getHours().toString(); hours = (hours.length == 1) ? "0" + hours : hours;
                var minutes = o.getMinutes().toString(); minutes = (minutes.length == 1) ? "0" + minutes : minutes;
                var seconds = o.getSeconds().toString(); seconds = (seconds.length == 1) ? "0" + seconds : seconds;
                var milliseconds = o.getMilliseconds().toString();
                var tzminutes = Math.abs(o.getTimezoneOffset());
                var tzhours = 0;
                while(tzminutes >= 60)
                {
                    tzhours++;
                    tzminutes -= 60;
                }
                tzminutes = (tzminutes.toString().length == 1) ? "0" + tzminutes.toString() : tzminutes.toString();
                tzhours = (tzhours.toString().length == 1) ? "0" + tzhours.toString() : tzhours.toString();
                var timezone = ((o.getTimezoneOffset() < 0) ? "+" : "-") + tzhours + ":" + tzminutes;
                s += year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds + "." + milliseconds + timezone;
            }
            // Array
            else if(o.constructor.toString().indexOf("function Array()") > -1)
            {	
            	for(var p in o)
                {
                	//alert(p+':'+p.indexOf("attr"));
                
                    if(!isNaN(p))   // linear array
                    {
                        (/function\s+(\w*)\s*\(/ig).exec(o[p].constructor.toString());
                        var type = RegExp.$1;
                        switch(type)
                        {
                            case "":
                                type = typeof(o[p]);
                            case "String":
                                type = "string"; break;
                            case "Number":
                                type = "int"; break;
                            case "Boolean":
                                type = "bool"; break;
                            case "Date":
                                type = "DateTime"; break;
                        }
                        s += "<" + type + ">" + SOAPClientParameters._serialize(o[p]) + "</" + type + ">"
                        //s += SOAPClientParameters._serialize(o[p])
                    }
                    else if (p.indexOf("attr") >= 0 )
                    {	
                    	//alert(p+":attr");
                    	if (p != "attr")
                    		s += "<ns1:" + p.replace("_attr", "") + SOAPClientParameters._setAttribute(o[p]['attr']) + ">" + SOAPClientParameters._serialize(o[p]) +  "</ns1:" + p.replace("_attr", "") + ">"
                    }
                    else if (p.indexOf("ar_at") >= 0 )
                    {
                    	//alert(p+":ar_at");
                    	for(var q in o[p]){
                    		s += "<ns1:" + p.replace("_ar_at", "") + SOAPClientParameters._setAttribute(o[p][q]['attr']) + ">"+ SOAPClientParameters._serialize(o[p][q]) + "</ns1:" + p.replace("_ar_at", "") + ">"
                    	}
                    }
                    else if (p == '_'){
                    	s += SOAPClientParameters._serialize(o[p]);
                    }
                    else   // associative array
                        s += "<ns1:" + p + ">" + SOAPClientParameters._serialize(o[p]) + "</ns1:" + p + ">"
                }
            }
            // Object or custom function
            else{
            	for(var p in o)
                    s += "<" + p + ">" + SOAPClientParameters._serialize(o[p]) + "</" + p + ">";
            }break;
        default:
            break; // throw new Error(500, "SOAPClientParameters: type '" + typeof(o) + "' is not supported");
    }
    return s;
}

SOAPClientParameters._setAttribute = function(o)
{
	var s = "";
 	for(var p in o)
    {
    	//alert(p+":attribute");
 	   	s += ' '+ p +'="'+ o[p] +'"';
    }
            
    return s;
}

function SOAPClient() {}

SOAPClient.username = null;
SOAPClient.password = null;

SOAPClient.invoke = function(url, method, parameters, async, callback)
{
	if(async)
		SOAPClient._loadWsdl(url, method, parameters, async, callback);
	else
		return SOAPClient._loadWsdl(url, method, parameters, async, callback);
}

// private: wsdl cache
SOAPClient_cacheWsdl = new Array();

// private: invoke async
SOAPClient._loadWsdl = function(url, method, parameters, async, callback)
{
	// load from cache?
	var wsdl = SOAPClient_cacheWsdl[url];
	if(wsdl + "" != "" && wsdl + "" != "undefined")
		return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
	// get wsdl
	var xmlHttp = SOAPClient._getXmlHttp();
	xmlHttp.open("GET", url + "?wsdl", async);

	if(async) 
	{
		xmlHttp.onreadystatechange = function() 
		{
			if(xmlHttp.readyState == 4)
				SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
		}
	}
	xmlHttp.send(null);
	if (!async)
		return SOAPClient._onLoadWsdl(url, method, parameters, async, callback, xmlHttp);
}
SOAPClient._onLoadWsdl = function(url, method, parameters, async, callback, req)
{
	var wsdl = req.responseXML;
	SOAPClient_cacheWsdl[url] = wsdl;	// save a copy in cache
	return SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
}
SOAPClient._sendSoapRequest = function(url, method, parameters, async, callback, wsdl)
{
	// get namespace
	var ns = (wsdl.documentElement.attributes["targetNamespace"] + "" == "undefined") ? wsdl.documentElement.attributes.getNamedItem("targetNamespace").nodeValue : wsdl.documentElement.attributes["targetNamespace"].value;
	// build SOAP request
	var sr = 
				'<?xml version="1.0" encoding="utf-8"?>' +
				'<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="http://gutp.jp/fiap/2009/11/" xmlns:ns2="http://soap.fiap.org/">' +
                '<SOAP-ENV:Body>'+
				'<ns2:' + method + 'RQ' + '>' +
				parameters.toXml() +
				'</ns2:' + method + 'RQ' + '></SOAP-ENV:Body></SOAP-ENV:Envelope>';
    // console.log(sr);
	// send request
	var xmlHttp = SOAPClient._getXmlHttp();
	if (SOAPClient.userName && SOAPClient.password){
		xmlHttp.open("POST", url, async, SOAPClient.userName, SOAPClient.password);
		// Some WS implementations (i.e. BEA WebLogic Server 10.0 JAX-WS) don't support Challenge/Response HTTP BASIC, so we send authorization headers in the first request
		xmlHttp.setRequestHeader("Authorization", "Basic " + SOAPClient._toBase64(SOAPClient.userName + ":" + SOAPClient.password));
	}
	else 
		xmlHttp.open("POST", url, async);
	var soapaction = ((ns.lastIndexOf("/") != ns.length - 1) ? ns + "/" : ns) + method;
	xmlHttp.setRequestHeader("SOAPAction", soapaction);
	xmlHttp.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	
    if(async) 
	{
		xmlHttp.onreadystatechange = function() 
		{
			if(xmlHttp.readyState == 4)
				SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
		}
	}
	
    if(async) 
    {
    
        xmlHttp.timeout = 10000;
        xmlHttp.ontimeout = function () { 

            $('#query_alert').fadeIn();
            console.log("send request again?");
            // if(confirm("send request again?")) {
            //     SOAPClient._sendSoapRequest(url, method, parameters, async, callback, wsdl);
            // } else {
            //     QueryComplete();
            // } 
        }
    }
    
    // console.log(sr);
    xmlHttp.send(sr);
    
	if (!async)
		return SOAPClient._onSendSoapRequest(method, async, callback, wsdl, xmlHttp);
}

SOAPClient._onSendSoapRequest = function(method, async, callback, wsdl, req) 
{
	// if (method == "data") {
 //        // method = "data";
 //        // console.log(req['response']);
 //    }
	if (req.status!=200) {
		$('#query_alert').fadeIn();
		console.log("Send Request Failed");
		// alert("Send Request Failed");
    } else {
    	$('#query_alert').fadeOut();
    }

	var o = null;
	var nd = SOAPClient._getElementsByTagName(req.responseXML, method + "RS");
	if(nd.length == 0)
		nd = SOAPClient._getElementsByTagName(req.responseXML, "ns2:"+ method + "RS");	// Firefox ?
	if(nd.length == 0)
		nd = SOAPClient._getElementsByTagName(req.responseXML, "return");	// PHP web Service?
	if(nd.length == 0)
	{
		if(req.responseXML.getElementsByTagName("faultcode").length > 0)
		{
		    if(async || callback)
		        o = new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);
			else
			    throw new Error(500, req.responseXML.getElementsByTagName("faultstring")[0].childNodes[0].nodeValue);			
		}
	}
	else
		o = SOAPClient._soapresult2object(nd[0], wsdl);
	if(callback)
		callback(o, req.responseXML);
	if(!async)
		return o;
}
SOAPClient._soapresult2object = function(node, wsdl)
{
    var wsdlTypes = SOAPClient._getTypesFromWsdl(wsdl);
    return SOAPClient._node2object(node, wsdlTypes);
}
SOAPClient._node2object = function(node, wsdlTypes)
{
	
	// null node
	if(node == null)
		return null;
	// text node
	if(node.nodeType == 3 || node.nodeType == 4) 
		return SOAPClient._extractValue(node, wsdlTypes);
	// leaf node
	if (node.childNodes.length == 1 && (node.childNodes[0].nodeType == 3 || node.childNodes[0].nodeType == 4))
		return SOAPClient._node2object(node.childNodes[0], wsdlTypes);
	var isarray = SOAPClient._getTypeFromWsdl(node.nodeName, wsdlTypes).toLowerCase().indexOf("arrayof") != -1;
	// object node
	if(!isarray) {

		var obj = null;
		if(node.hasChildNodes()){
			obj = new Object();
			if(node.nodeName == "point" ){
				obj['value'] = new Array();
				obj['time'] = new Array();
			}
			if(node.nodeName == "pointSet" ){
				obj['id'] = new Array();
				obj["pointSet"] = new Object();
				obj["point"] = new Object();
			}
			if(node.nodeName == "query"){
				obj[node.childNodes[0].nodeName] = new Object();
				obj[node.childNodes[0].nodeName]['id'] = new Array();
			}
			if(node.nodeName == "body"){
				obj['id'] = new Array();
				obj[node.childNodes[0].nodeName] = new Object();
			}
		}
		for(var i = 0; i < node.childNodes.length; i++)
		{
			// for recieve cursor in response package
			var p = SOAPClient._node2object(node.childNodes[i], wsdlTypes);
			if(node.nodeName == "point" && node.childNodes[i].nodeName=="value" ){
				obj['value'].push(p);
				obj['time'].push(node.childNodes[i].getAttribute("time"));
			}else if(node.nodeName=="pointSet"){
				obj[node.childNodes[i].nodeName][node.childNodes[i].getAttribute("id")] = p;
				obj['id'].push(node.childNodes[i].getAttribute("id"));
			}else if(node.nodeName == "body" && (node.childNodes[i].nodeName=="point" || node.childNodes[i].nodeName=="pointSet") ){
				// console.log(node.childNodes[i].getAttribute("id"));
				// console.log(obj["point"]);
				// console.log(obj["point"].hasOwnProperty(node.childNodes[i].getAttribute("id")));
				// console.log(p)
				if (obj["point"].hasOwnProperty(node.childNodes[i].getAttribute("id"))) {
					if ((obj["point"][node.childNodes[i].getAttribute("id")] !== null) && (p!==null)) {
						obj["point"][node.childNodes[i].getAttribute("id")]["value"] = obj["point"][node.childNodes[i].getAttribute("id")]["value"].concat(p["value"]);
						obj["point"][node.childNodes[i].getAttribute("id")]["time"] = obj["point"][node.childNodes[i].getAttribute("id")]["time"].concat(p["time"]);
					}
				} else {
					obj["point"][node.childNodes[i].getAttribute("id")] = p;
					obj['id'].push(node.childNodes[i].getAttribute("id"));
				}
			}
			else if(node.nodeName == "header" && node.childNodes[i].nodeName=="query"){
				obj[node.childNodes[i].nodeName] = new Object();
				obj[node.childNodes[i].nodeName]['id'] = node.childNodes[i].getAttribute("id");
				obj[node.childNodes[i].nodeName]['cursor'] = node.childNodes[i].getAttribute("cursor");
				obj[node.childNodes[i].nodeName]['_'] = p;
			}else if(node.nodeName == "query" && node.childNodes[i].nodeName=="key"){
				obj[node.childNodes[i].nodeName]['id'][i] = node.childNodes[i].getAttribute("id");
			}else{
				obj[node.childNodes[i].nodeName] = p;
			}
		}
		return obj;
	}
	// list node
	else
	{
		// create node ref
		var l = new Array();
		for(var i = 0; i < node.childNodes.length; i++)
			l[l.length] = SOAPClient._node2object(node.childNodes[i], wsdlTypes);
		return l;
	}
	return null;
}
SOAPClient._extractValue = function(node, wsdlTypes)
{
	var value = node.nodeValue;
	//alert(node.parentNode.nodeName);
	switch(SOAPClient._getTypeFromWsdl(node.parentNode.nodeName, wsdlTypes).toLowerCase())
	{
		default: 
		case "s:string":			
			return (value != null) ? value + "" : "";
		case "s:boolean":
			return value + "" == "true";
		case "s:int":
		case "s:long":
			return (value != null) ? parseInt(value + "", 10) : 0;
		case "s:double":
			return (value != null) ? parseFloat(value + "") : 0;
		case "s:datetime":
			if(value == null)
				return null;
			else
			{
				value = value + "";
				value = value.substring(0, (value.lastIndexOf(".") == -1 ? value.length : value.lastIndexOf(".")));
				value = value.replace(/T/gi," ");
				value = value.replace(/-/gi,"/");
				var d = new Date();
				d.setTime(Date.parse(value));										
				return d;				
			}
	}
}
SOAPClient._getTypesFromWsdl = function(wsdl)
{
	var wsdlTypes = new Array();
	// IE
	var ell = wsdl.getElementsByTagName("s:element");	
	var useNamedItem = true;
	// MOZ
	if(ell.length == 0)
	{
		ell = wsdl.getElementsByTagName("element");	     
		useNamedItem = false;
	}
	for(var i = 0; i < ell.length; i++)
	{
		if(useNamedItem)
		{
			if(ell[i].attributes.getNamedItem("name") != null && ell[i].attributes.getNamedItem("type") != null) 
				wsdlTypes[ell[i].attributes.getNamedItem("name").nodeValue] = ell[i].attributes.getNamedItem("type").nodeValue;
		}	
		else
		{
			if(ell[i].attributes["name"] != null && ell[i].attributes["type"] != null)
				wsdlTypes[ell[i].attributes["name"].value] = ell[i].attributes["type"].value;
		}
	}
	return wsdlTypes;
}
SOAPClient._getTypeFromWsdl = function(elementname, wsdlTypes)
{
    var type = wsdlTypes[elementname] + "";
    return (type == "undefined") ? "" : type;
}
// private: utils
SOAPClient._getElementsByTagName = function(document, tagName)
{
	try
	{
		// trying to get node omitting any namespaces (latest versions of MSXML.XMLDocument)
		return document.selectNodes(".//*[local-name()=\""+ tagName +"\"]");
	}
	catch (ex) {}
	// old XML parser support
	return document.getElementsByTagName(tagName);
}
// private: xmlhttp factory
SOAPClient._getXmlHttp = function() 
{
	try
	{
		if(window.XMLHttpRequest) 
		{
			var req = new XMLHttpRequest();
			// some versions of Moz do not support the readyState property and the onreadystate event so we patch it!
			if(req.readyState == null) 
			{
				req.readyState = 1;
				req.addEventListener("load", 
									function() 
									{
										req.readyState = 4;
										if(typeof req.onreadystatechange == "function")
											req.onreadystatechange();
									},
									false);
			}
			return req;
		}
		if(window.ActiveXObject) 
			return new ActiveXObject(SOAPClient._getXmlHttpProgID());
	}
	catch (ex) {}
	throw new Error("Your browser does not support XmlHttp objects");
}
SOAPClient._getXmlHttpProgID = function()
{
	if(SOAPClient._getXmlHttpProgID.progid)
		return SOAPClient._getXmlHttpProgID.progid;
	var progids = ["Msxml2.XMLHTTP.5.0", "Msxml2.XMLHTTP.4.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
	var o;
	for(var i = 0; i < progids.length; i++)
	{
		try
		{
			o = new ActiveXObject(progids[i]);
			return SOAPClient._getXmlHttpProgID.progid = progids[i];
		}
		catch (ex) {};
	}
	throw new Error("Could not find an installed XML parser");
}

SOAPClient._toBase64 = function(input)
{
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "";
	var chr1, chr2, chr3;
	var enc1, enc2, enc3, enc4;
	var i = 0;

	do {
		chr1 = input.charCodeAt(i++);
		chr2 = input.charCodeAt(i++);
		chr3 = input.charCodeAt(i++);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
		keyStr.charAt(enc3) + keyStr.charAt(enc4);
	} while (i < input.length);

	return output;
}
