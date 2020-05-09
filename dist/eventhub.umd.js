!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):t.Eventhub=e()}(this,function(){var t="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},e=null;"undefined"!=typeof WebSocket?e=WebSocket:"undefined"!=typeof MozWebSocket?e=MozWebSocket:void 0!==t?e=t.WebSocket||t.MozWebSocket:"undefined"!=typeof window?e=window.WebSocket||window.MozWebSocket:"undefined"!=typeof self&&(e=self.WebSocket||self.MozWebSocket);var s,i=e;!function(t){t.PUBLISH="publish",t.SUBSCRIBE="subscribe",t.UNSUBSCRIBE="unsubscribe",t.UNSUBSCRIBE_ALL="unsubscribeAll",t.LIST="list",t.HISTORY="history",t.PING="ping",t.DISCONNECT="disconnect"}(s||(s={}));var n=function(){this.pingInterval=1e4,this.pingTimeout=3e3,this.maxFailedPings=3,this.reconnectInterval=1e4,this.disablePingCheck=!1},o=function(t,e,s){this._rpcResponseCounter=0,this._rpcCallbackList=[],this._subscriptionCallbackList=[],this._sentPingsList=[],this._wsUrl=t+"/?auth="+e,this._socket=void 0,this._isConnected=!1,this._opts=new n,Object.assign(this._opts,s)};return o.prototype.connect=function(){var t=this;return new Promise(function(e,s){t._socket=new i(t._wsUrl),t._socket.onmessage=t._parseRPCResponse.bind(t),t._socket.onopen=function(){this._isConnected=!0,this._opts.disablePingCheck||this._startPingMonitor(),e(!0)}.bind(t),t._socket.onerror=function(t){this._isConnected?(console.log("Eventhub WebSocket connection error:",t),this._isConnected=!1,this._reconnect()):s(t)}.bind(t),t._socket.onclose=function(t){this._isConnected&&(this._isConnected=!1,this._reconnect())}.bind(t)})},o.prototype._reconnect=function(){var t=this;if(!this._isConnected){var e=this._opts.reconnectInterval;this._socket.readyState!=i.CLOSED&&this._socket.readyState!=i.CLOSING&&this._socket.close(),this._opts.disablePingCheck||(clearInterval(this._pingTimer),clearInterval(this._pingTimeOutTimer),this._sentPingsList=[]),this.connect().then(function(e){var s=t._subscriptionCallbackList.slice();t._rpcResponseCounter=0,t._rpcCallbackList=[],t._subscriptionCallbackList=[];for(var i=0,n=s;i<n.length;i+=1){var o=n[i];t.subscribe(o.topic,o.callback,{sinceEventId:o.lastRecvMessageId})}}).catch(function(s){setTimeout(t._reconnect.bind(t),e)})}},o.prototype._startPingMonitor=function(){var t=this._opts.pingInterval,e=this._opts.maxFailedPings;this._pingTimer=setInterval(function(){var t=this;if(this._isConnected){var e={timestamp:Date.now(),rpcRequestId:this._rpcResponseCounter+1};this._sentPingsList.push(e),this._sendRPCRequest(s.PING,[]).then(function(s){for(var i=0;i<t._sentPingsList.length;i++)t._sentPingsList[i].rpcRequestId==e.rpcRequestId&&t._sentPingsList.splice(i,1)})}}.bind(this),t),this._pingTimeOutTimer=setInterval(function(){for(var t=Date.now(),s=0,i=0;i<this._sentPingsList.length;i++)t>this._sentPingsList[i].timestamp+this._opts.pingTimeout&&s++;s>=e&&(this._isConnected=!1,this._reconnect())}.bind(this),t)},o.prototype._sendRPCRequest=function(t,e){var s=this;this._rpcResponseCounter++;var n={id:this._rpcResponseCounter,jsonrpc:"2.0",method:t,params:e};return new Promise(function(t,e){if(s._socket.readyState==i.OPEN){s._rpcCallbackList.push([s._rpcResponseCounter,function(s,i){null!=s?e(s):t(i)}.bind(s)]);try{s._socket.send(JSON.stringify(n))}catch(t){e(t)}}else e(new Error("WebSocket is not connected."))})},o.prototype._parseRPCResponse=function(t){try{var e=JSON.parse(t.data);if(!e.hasOwnProperty("id")||"null"==e.id)return;if(e.hasOwnProperty("result")&&e.result.hasOwnProperty("message")&&e.result.hasOwnProperty("topic"))for(var s=0,i=this._subscriptionCallbackList;s<i.length;s+=1){var n=i[s];if(n.rpcRequestId==e.id)return n.lastRecvMessageId=e.result.id,void n.callback(e.result)}for(var o=void 0,r=0,c=this._rpcCallbackList;r<c.length;r+=1){var a=c[r];if(a[0]==e.id){o=a[1];break}}if(void 0===o)return;e.hasOwnProperty("error")?o(e.error,null):e.hasOwnProperty("result")&&o(null,e.result);for(var p=0;p<this._rpcCallbackList.length;p++)this._rpcCallbackList[p][0]==e.id&&this._rpcCallbackList.splice(p,1)}catch(t){return void console.log("Failed to parse websocket response:",t)}},o.prototype.isSubscribed=function(t){for(var e=0,s=this._subscriptionCallbackList;e<s.length;e+=1)if(s[e].topic==t)return!0;return!1},o.prototype.subscribe=function(t,e,i){var n={topic:t};return""==t?new Promise(function(t,e){e(new Error("Topic cannot be empty."))}):(void 0!==i&&(n=Object.assign(n,i)),this.isSubscribed(t)?new Promise(function(e,s){s(new Error("Already subscribed to "+t))}):(this._subscriptionCallbackList.push({topic:t,rpcRequestId:this._rpcResponseCounter+1,callback:e}),this._sendRPCRequest(s.SUBSCRIBE,n)))},o.prototype.unsubscribe=function(t){var e=[];if("string"==typeof t?e.push(t):e=t,e.length>0){for(var i=0,n=e;i<n.length;i+=1)for(var o=n[i],r=0;r<this._subscriptionCallbackList.length;r++)o==this._subscriptionCallbackList[r].topic&&this._subscriptionCallbackList.splice(r,1);this._sendRPCRequest(s.UNSUBSCRIBE,e)}},o.prototype.unsubscribeAll=function(){this._subscriptionCallbackList=[],this._sendRPCRequest(s.UNSUBSCRIBE_ALL,[])},o.prototype.publish=function(t,e,i){var n={topic:t,message:e};return void 0!==i&&(n=Object.assign(n,i)),this._sendRPCRequest(s.PUBLISH,n)},o.prototype.listSubscriptions=function(){return this._sendRPCRequest(s.LIST,[])},o});
//# sourceMappingURL=eventhub.umd.js.map
