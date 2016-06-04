angular.module('ion-image-search').factory('googleSearch', ['$injector', '$q', '$http', '$log', function ($injector, $q, $http, $log) {
    var GoogleSearch = function (configuration) {
        var self = this;

        if (!configuration ||
            !configuration.fileType ||
            !configuration.imgSize){
            throw new Error('Search provider must be constructed with proper configuration');
        }

        self.configuration = configuration;
    };

    var googleParams = $injector.get('googleParams');

    var isResponseWithoutErrors = function(res){
        return (res && res.data);
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
        query["q"] = searchText;
        query["key"] = googleParams.key;
        query["safe"] = "high";
        query["cx"] = googleParams.customSearch;
        query["searchType"] = "image";
        query["fileType"] = this.configuration.fileType;
        query["imgSize"] = this.configuration.imgSize;
        query["start"] = startIndex;
        return googleParams.address + serializeQuery(query);
    };

    var handleDataReturned = function(data){
        var retval = [];
        if (data.items && data.items.length>0) {
            data.items.forEach(function (item) {
                retval.push({url: item.link});
            });
        } else{
            $log.warn('returned no images');
        }
        return retval;
    };

    GoogleSearch.prototype.query = function(searchText, startIndex){
        var deferred = $q.defer();
        var options = {};
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
            var errMessage = (e && e.data && e.data.error)? e.data.error.message:((e)? e.toString():"no message");

            $log.warn('Failed getting images ' + errMessage);
            deferred.reject();
        });
        return deferred.promise;
    };

    GoogleSearch.prototype.getPageSize = function(){
        return googleParams.pageSize;
    };

    return GoogleSearch;
}]);