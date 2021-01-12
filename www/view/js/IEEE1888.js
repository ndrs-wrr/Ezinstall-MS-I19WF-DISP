
//create this variable for use to store temporarity data

// var _tmp_data = {};
var _tmp_ieee1888 = {};

/*******************************************************************************************************************************************
 * UUID Function 
 */


function uuid(){
     return "{0}{1}-{2}-{3}-{4}-{5}{6}{7}".format(
        mt_rand("0","0xffff"), mt_rand("0","0xffff"), mt_rand("0","0xffff"),
        ('0x'+mt_rand("0","0x0fff") | 0x4000).toString(16),
        ('0x'+mt_rand("0","0x3fff") | 0x8000).toString(16),
        mt_rand("0","0xffff"), mt_rand("0","0xffff"), mt_rand("0","0xffff"));
}

// implemented String.format
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function mt_rand (min, max) {
    // http://kevin.vanzonneveld.net
    // +   original by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   input by: Kongo
    // *     example 1: mt_rand(1, 1);
    // *     returns 1: 1
    var argc = arguments.length;
    if (argc === 0) {
        min = 0;
        max = 2147483647;
    }
    else if (argc === 1) {
        throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given');
    }
    else {
        min = parseInt(min, 16);
        max = parseInt(max, 16);
    }
    hex = (Math.floor(Math.random() * (max - min + 1)) + min).toString(16);
    return "0000".substr(0, 4 - hex.length) + hex;;
}

/*******************************************************************************************************************************************
 * ISO Date Format Function 
 */

function isoDate(local) {
    var tzo = -local.getTimezoneOffset();
    var sign = tzo >= 0 ? '+' : '-';
    return local.getFullYear() 
        + '-' + pad(local.getMonth()+1)
        + '-' + pad(local.getDate())
        + 'T' + pad(local.getHours())
        + ':' + pad(local.getMinutes()) 
        + ':' + pad(local.getSeconds()) 
        + sign + pad(tzo / 60) 
        + ':' + pad(tzo % 60);
}

function isoDateWithoutTimestamp(local) {
    var tzo = -local.getTimezoneOffset();
    var sign = tzo >= 0 ? '+' : '-';
    return local.getFullYear() 
        + '-' + pad(local.getMonth()+1)
        + '-' + pad(local.getDate())
        + 'T' + pad(local.getHours())
        + ':' + pad(local.getMinutes()) 
        + ':' + pad(local.getSeconds());
}

function pad(num) {
    norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
}



/*******************************************************************************************************************************************/


var IEEE1888 = Class.extend({
    
    init: function() {
        this.keyAttr = {};
        this.responseFunc = this.queryResponse;
        this.callbackFunc = null;
        this.url = "";
        this.point_id = [];
        this._tmp_data = {};
        this.key = [];
        this.error_point_id = []; 
    },
    
    resetKeyAttr: function(){
        this.keyAttr = {};
    },  
    
    setKeyAttr: function(name, val) {
        this.keyAttr[name] = val;
    },

    getKeyAttr: function(){
        return JSON.parse(JSON.stringify(this.keyAttr));
    },

    resetKey: function(val) {
        this.key = [];
    },

    addKey: function(val) {
        this.key.push(val);
    },

    removeKey: function(pid) {
        var key = this.key
        for (var i = 0; i < key.length; i++) {
            if (pid === key[i].attr.id) {
                key.splice(i, 1);
                this.error_point_id.push(pid);   
            }
        }
    },

    resetPointID: function(point_id) {
        this.point_id = [];
    },

    setPointID: function(point_id) {
        this.point_id = point_id;
    },
    
    getPointID: function() {
        return JSON.parse(JSON.stringify(this.point_id));
    },

    removePointID: function(pid) {
        // remove query_id
        var index = this.point_id.indexOf(pid);
        if (index > -1) {
            this.point_id.splice(index, 1);
            this.error_point_id.push(pid);
        }
    },

    setURL: function(url) {
        this.url = url;
    },

    getURL: function() {
        return JSON.parse(JSON.stringify(this.url));
    },

    setCallbackFunc: function(funcName) {
        this.callbackFunc = funcName;
    },

    setResponseFunc: function(funcName) {
        this.responseFunc = funcName;
    },

    query: function() {
        this.startLog();
        this.queryRequest();
    },

    data: function(write_data) {

        var point = [];
        var body = [];
        var transport = [];
        var uid = uuid();
        
        for (var pnt_id in write_data) {
            var pnt_data = write_data[pnt_id];
            var data = [];
            for (var time in pnt_data) {
                var tmp = [];
                tmp["attr"] = {"time": time};
                tmp["_"] = pnt_data[time];
                data.push(tmp);
            }
            var tmp = [];
            tmp["attr"] = {"id": pnt_id};
            tmp["value_ar_at"] = data
            point.push(tmp);
        }

        // set package
        body["point_ar_at"] = point;
        transport["body"] = body;
        
        var pl = new SOAPClientParameters();
        pl.add("transport", transport);
        //store this object to _tmp_ieee1888        
        _tmp_ieee1888[uid] = this;

        if (this.url =="") {
            alert("cannot get service url data");
            return 0;
        }
        SOAPClient.invoke(this.url, "data", pl, true, this.callbackFunc);
    },

    dataResponse: function(response) {   
        console.log(response);
        if (response['transport']['header'].hasOwnProperty('error')) {
            var error_msg = response['transport']['header']['error'];
            console.log(error_msg);
        } else {
            console.log("write success");
        }
    },

    queryRequest: function(cursor) {
        
        var key = [];
        var query = [];
        var header = [];
        var transport = [];
        var uid = uuid();
        // set key attribute
        var point_id = JSON.parse(JSON.stringify(this.point_id));
        // check point id

        // console.log(this.key);

        if (this.key.length <= 0) {

            if (point_id.length <= 0) { 
                console.log("no point id receive.");
                return 0;
            }
            for (var i = 0; i < point_id.length; i++) {
                key[i] = [];
                key[i]["attr"] = JSON.parse(JSON.stringify(this.keyAttr));
                key[i]["attr"]["id"] = point_id[i];
            }

        } else {
            key = key.concat(this.key);
            if (key.length <= 0) { 
                console.log("no point id receive.");
                return 0;
            }
        }

        // console.log(key);

        // check query cursor  
        if (cursor == null) {
            this._tmp_data = {};
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000" };
        } 
        else if (cursor == "retry") {
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000" };
        } else {
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000", "cursor":cursor };
        }

        // set package
        query["key_ar_at"] = key;
        header["query_attr"] = query;
        transport["header"] = header;
        
        // console.log(transport)
        var pl = new SOAPClientParameters();
        pl.add("transport", transport);
        //store this object to _tmp_ieee1888        
        _tmp_ieee1888[uid] = this;

        if (this.url =="") {
            alert("cannot get service url data");
            return 0;
        }
        SOAPClient.invoke(this.url, "query", pl, true, this.responseFunc);
        
    },

    queryResponse: function(response) {   

        var uid = response['transport']['header']['query']['id'];
        // error handle
        if (response['transport']['header'].hasOwnProperty('error')) {
            var error_msg = response['transport']['header']['error'];
            console.log(error_msg);
            if (error_msg.indexOf('was not found') !== -1) {
                var error_pid = error_msg.split(" ",1)[0];
                var tmp = _tmp_ieee1888[uid]._tmp_data; 
                if (!tmp.hasOwnProperty('point')) {
                    tmp.point = {};
                } 
                tmp.point[error_pid] = null;
                // remove query_pid
                if (_tmp_ieee1888[uid].point_id.length == 0) {
                    _tmp_ieee1888[uid].removeKey(error_pid);
                    // retry query if query pid exist
                    if (_tmp_ieee1888[uid].key.length > 0) {
                        _tmp_ieee1888[uid].queryRequest("retry");
                    } else {
                        _tmp_ieee1888[uid].callbackFunc(tmp.point);
                    }    
                } else {
                    _tmp_ieee1888[uid].removePointID(error_pid);
                    // retry query if query pid exist
                    if (_tmp_ieee1888[uid].point_id.length > 0) {
                        _tmp_ieee1888[uid].queryRequest("retry");
                    } else {
                        _tmp_ieee1888[uid].callbackFunc(tmp.point);
                    }
                }
                delete _tmp_ieee1888[uid];
            } else {
                return 0;
            }

        } else {

            var point = response['transport']['body']['point'];
            var point_id = response['transport']['body']['id'][0];

            // check end of data
            if (response['transport']['header']['query']['cursor'] !== null) {
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;   
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // update logging  
                _tmp_ieee1888[uid].updateLog();
                // request data again
                var cursor = response['transport']['header']['query']['cursor'];
                _tmp_ieee1888[uid].queryRequest(cursor);
                delete _tmp_ieee1888[uid];
                
            } else { 
                // end of data
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // end logging  
                _tmp_ieee1888[uid].endLog();
                // sent data to callback Func

                var index = _tmp_ieee1888[uid].point_id.indexOf(point_id);
                _tmp_ieee1888[uid].point_id.splice(index, 1);

                // console.log(_tmp_ieee1888.point_id);

                _tmp_ieee1888[uid].callbackFunc(tmp.point);
                delete _tmp_ieee1888[uid];
            
            }
        }
        
    },

    querySplit: function() {

        this.startLog();
        var point_id = JSON.parse(JSON.stringify(this.point_id));
        // check point id
        if (point_id.length <= 0) { 
            alert("no point id receive.");
            return 0;
        }
        for (var i = 0; i < point_id.length; i++) {
            this.querySplitRequest(point_id[i]);
        }
    },

    querySplitRequest: function(point_id, cursor) {
        
        var key = [];
        var query = [];
        var header = [];
        var transport = [];
        var uid = uuid();
        // set key attribute
        key[0] = [];
        key[0]["attr"] = JSON.parse(JSON.stringify(this.keyAttr));
        key[0]["attr"]["id"] = point_id;
        // check query cursor  
        if (cursor == null) {
            this._tmp_data = {};
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000" };
        } else if (cursor == "retry") {
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000" };
        } else {
            query["attr"] = { "type":"storage", "id":uid, "acceptableSize":"1000", "cursor":cursor };
        }
        // set package
        query["key_ar_at"] = key;
        header["query_attr"] = query;
        transport["header"] = header;
        var pl = new SOAPClientParameters();
        pl.add("transport", transport);
        //store this object to _tmp_ieee1888        
        _tmp_ieee1888[uid] = this;

        if (this.url =="") {
            alert("cannot get service url data");
            return 0;
        }
        SOAPClient.invoke(this.url, "query", pl, true, this.responseFunc);
        
    },

    querySplitResponse: function(response) {   
        // console.log(response['transport']['header']['query']['id']);
        var uid = response['transport']['header']['query']['id'];

        // error handle
        if (response['transport']['header'].hasOwnProperty('error')) {
            var error_msg = response['transport']['header']['error'];
            console.log(error_msg);
            if (error_msg.indexOf('was not found') !== -1) {
                var error_pid = error_msg.split(" ",1)[0];
                var tmp = _tmp_ieee1888[uid]._tmp_data; 
                if (!tmp.hasOwnProperty('point')) {
                    tmp.point = {};
                } 
                tmp.point[error_pid] = null;
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // update logging  
                _tmp_ieee1888[uid].updateLog();
                // remove query_id
                var i = _tmp_ieee1888[uid].point_id.indexOf(error_pid);
                if (i > -1) {
                    _tmp_ieee1888[uid].point_id.splice(i, 1);
                    _tmp_ieee1888[uid].error_point_id.push(error_pid);
                }
                // retry query if query pid exist
                if (_tmp_ieee1888[uid].point_id.length > 0) {
                    _tmp_ieee1888[uid].queryRequest("retry");
                } else {
                    _tmp_ieee1888[uid].callbackFunc(tmp.point);
                }
                delete _tmp_ieee1888[uid];
            }

        } else {

            var point = response['transport']['body']['point'];
            var point_id = response['transport']['body']['id'][0];
            // check end of data
            if (response['transport']['header']['query']['cursor'] !== null) {
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;   
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // update logging  
                _tmp_ieee1888[uid].updateLog();
                // request data again
                var cursor = response['transport']['header']['query']['cursor'];
                _tmp_ieee1888[uid].querySplitRequest(point_id,cursor);
                delete _tmp_ieee1888[uid];
                
            } else { 
                // end of data
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // end logging  
                _tmp_ieee1888[uid].endLog();
                // sent data to callback Func

                var index = _tmp_ieee1888[uid].point_id.indexOf(point_id);
                _tmp_ieee1888[uid].point_id.splice(index, 1);

                // console.log(_tmp_ieee1888[uid].point_id);

                if (_tmp_ieee1888[uid].point_id.length == 0) {
                    _tmp_ieee1888[uid].callbackFunc(tmp.point);
                }
                delete _tmp_ieee1888[uid];

            }
        }
        
    },

    queryAsync: function() {

        this.startLog();
        var point_id = JSON.parse(JSON.stringify(this.point_id));
        // check point id
        if (point_id.length <= 0) { 
            alert("no point id receive.");
            return 0;
        }
        this.responseFunc = this.queryAsyncResponse;
        for (var i = 0; i < point_id.length; i++) {
            this.querySplitRequest(point_id[i]);
        }
    },

    queryAsyncResponse: function(response) {   
        var uid = response['transport']['header']['query']['id'];

        // error handle
        if (response['transport']['header'].hasOwnProperty('error')) {
            var error_msg = response['transport']['header']['error'];
            console.log(error_msg);
            if (error_msg.indexOf('was not found') !== -1) {
                var error_pid = error_msg.split(" ",1)[0];
                var tmp = _tmp_ieee1888[uid]._tmp_data; 
                if (!tmp.hasOwnProperty('point')) {
                    tmp.point = {};
                } 
                tmp.point[error_pid] = null;
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // update logging  
                _tmp_ieee1888[uid].updateLog();
                // remove query_id
                var i = _tmp_ieee1888[uid].point_id.indexOf(error_pid);
                if (i > -1) {
                    _tmp_ieee1888[uid].point_id.splice(i, 1);
                    _tmp_ieee1888[uid].error_point_id.push(error_pid);
                }
                // retry query if query pid exist
                if (_tmp_ieee1888[uid].point_id.length > 0) {
                    _tmp_ieee1888[uid].queryRequest("retry");
                } else {
                    _tmp_ieee1888[uid].callbackFunc(tmp.point);
                }
                delete _tmp_ieee1888[uid];
            } else {
                return 0;
            }
        } else {

            var point = response['transport']['body']['point'];
            var point_id = response['transport']['body']['id'][0];
            // check end of data
            if (response['transport']['header']['query']['cursor'] !== null) {
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;   
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // update logging  
                _tmp_ieee1888[uid].updateLog();
                // request data again
                var cursor = response['transport']['header']['query']['cursor'];
                _tmp_ieee1888[uid].querySplitRequest(point_id,cursor);
                
            } else { 
                // end of data
                // get data stored
                var tmp = _tmp_ieee1888[uid]._tmp_data;
                // insert new data
                if (tmp.hasOwnProperty('point')) {
                    for (var point_name in point) {
                        if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] != null)) {
                            tmp['point'][point_name]['value'] = tmp['point'][point_name]['value'].concat(point[point_name]['value']);
                            tmp['point'][point_name]['time'] = tmp['point'][point_name]['time'].concat(point[point_name]['time']);
                        }
                        else if ((tmp['point'].hasOwnProperty(point_name)) && (point[point_name] == null)) {
                            // do nothing
                        } else {
                            tmp['point'][point_name] = point[point_name]; 
                        }
                    }
                } else {
                    tmp.point = point;
                }
                // store data
                _tmp_ieee1888[uid]._tmp_data = tmp;
                // end logging  
                _tmp_ieee1888[uid].endLog();
                // sent data to callback Func
                var return_data = {};
                return_data[point_id] = tmp['point'][point_id]; 
                _tmp_ieee1888[uid].callbackFunc(return_data);
            }
        }
        
    },

    startLog: function() {

        var point_id = this.getPointID();
        var attr = this.getKeyAttr();
        var start = new Date();
        var end = new Date();
        if (attr.hasOwnProperty('gt')) {
            start = new Date(attr['gt']);
        } else if (attr.hasOwnProperty('gteq')) {
            start = new Date(attr['gteq']);
        }
        if (attr.hasOwnProperty('lt')) {
            end = new Date(attr['lt']); 
        } else if (attr.hasOwnProperty('lteq')) {
            end = new Date(attr['lteq']); 
        } 
        
        var estimate_day = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
        var estimate_value = estimate_day * (60 * 24) * point_id.length;
        var estimate_round = estimate_value / 1000;
        
        var query_status = {

            round: 0,
            total: parseInt(estimate_round+1),
            percent: 0,
            query_start: start.toString(),
            query_end: end.toString(),
            status: 'loading...',
            request_from: 'storage'
        }
          
        localStorage['query_status'] = JSON.stringify(query_status);
    },

    updateLog: function() {
        ///get log from session
        var query_status = JSON.parse(localStorage['query_status']);
        ///update round & percent
        query_status.round++;
        query_status.percent = (query_status.round / query_status.total) * 100;
        
        ///set log back to session
        localStorage['query_status'] = JSON.stringify(query_status);
        
    },

    endLog: function() {
        ///get log from session
        var query_status = JSON.parse(localStorage['query_status']);
        ///update round, percent, status  
        query_status.round++;
        // query_status.end_time = Date();
        query_status.percent = (query_status.round / query_status.total) * 100;
        query_status.status = "complete."
        // console.log(query_status);
        
    }

});

