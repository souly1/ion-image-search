angular.module('ion-image-search').factory('bingSearch', ['$injector', '$q', '$http', '$log', function ($injector, $q, $http, $log) {
    var BingSearch = function (configuration) {
        var self = this;

        if (!configuration ||
            !configuration.fileType ||
            !configuration.imgSize){
            throw new Error('Search provider must be constructed with proper configuration');
        }

        self.configuration = configuration;
    };

    var bingParams = $injector.get('bingParams');

    var isResponseWithoutErrors = function(res){
        return (res && res.data && res.data.d);
    };

    var serializeQuery = function(obj) {
        var str = [];
        for(var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    };

    var prepareUrl = function(searchText, startIndex){
        var query = {};
        query["Query"] = "'" + searchText + "'";
        query["Adult"] = "'" + "Strict" + "'";
        var imgSize = this.configuration.imgSize;
        imgSize = imgSize.charAt(0).toUpperCase() + imgSize.slice(1);
        query["ImageFilters"] = "'Size:" + imgSize.toString() + "+Aspect:Square'";
        query["$skip"] = startIndex;
        return bingParams.address + serializeQuery(query);
    };

    var handleDataReturned = function(data){
        var retval = [];
        if (data.d && data.d.results && data.d.results.length > 0) {
            data.d.results.forEach(function (result) {
                //Thumbnail and not direct to avoid security issues that Chrome may popup
                retval.push({url: result.Thumbnail.MediaUrl});
            });
        } else{
            $log.warn('returned no images');
        }
        return retval;
    };

    BingSearch.prototype.query = function(searchText, startIndex){
        var deferred = $q.defer();
        var options = {};
        options['headers'] = {'Authorization': bingParams.auth};
        var url = prepareUrl.call(this, searchText, startIndex);

        $http.get(url, options).then(function (res) {
            if (isResponseWithoutErrors(res)) {
                var items = handleDataReturned(res.data, deferred);
                if (items && items.length>0){
                    deferred.resolve(items);
                } else {
                    deferred.reject();
                }
            } else {
                $log.warn('returned no data');
                deferred.reject();
            }
        }, function (e) {
            var errMessage = (e && e.data)? e.data: "No Error";

            $log.warn('Failed getting images ' + errMessage);
            deferred.reject();
        });
        return deferred.promise;
    };

    BingSearch.prototype.getPageSize = function(){
        return bingParams.pageSize;
    };

    return BingSearch;
}]);