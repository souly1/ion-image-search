angular.module('ion-image-search').factory('flickrSearch', ['$injector', '$q', '$http', '$log', function ($injector, $q, $http, $log) {
    var FlickrSearch = function (configuration) {
        var self = this;

        if (!configuration ||
            !configuration.fileType ||
            !configuration.imgSize){
            throw new Error('Search provider must be constructed with proper configuration');
        }

        self.configuration = configuration;
    };

    var flickrParams = $injector.get('flickrParams');

    var isResponseWithoutErrors = function(res){
        return (res && res.data && res.data.stat !== "fail");
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
        query["api_key"] = flickrParams.key;
        query["text"] = searchText;
        query["privacy_filter"] = "public";
        query["content_type"] = "7";
        query["media"] = "photos";
        query["format"] = "json";
        query["per_page"] = flickrParams.pageSize;
        query["page"] = startIndex;
        query["extras"] = 'url_m';
        return flickrParams.address + serializeQuery(query);
    };

    var handleDataReturned = function(data){
        if (data.photos && data.photos.photo && data.photos.photo.length > 0) {
            var retval = [];
            var property= "url_m";
            data.photos.photo.forEach(function (photo) {
                //Thumbnail and not direct to avoid security issues that Chrome may popup
                retval.push({url: photo[property]});
            });
        } else{
            $log.warn('returned no images');
        }
        return retval;
    };

    FlickrSearch.prototype.query = function(searchText, startIndex){
        var deferred = $q.defer();
        var options = {};
        var url = prepareUrl.call(this, searchText, startIndex);

        $http.get(url, options).then(function (res) {
            res.data = res.data.replace('jsonFlickrApi(','');
            res.data = res.data.slice(0, -1);
            res.data = JSON.parse(res.data);

            if (isResponseWithoutErrors(res)) {
                var items = handleDataReturned(res.data, deferred);
                if (items && items.length>0){
                    deferred.resolve(items);
                } else {
                    deferred.reject();
                }
            } else {
                $log.warn('returned no data');
                if (res.data.stat === "fail"){
                    $log.warn('Error: ' + res.data.message);
                }

                deferred.reject();
            }
        }, function (e) {
            var errMessage = (e && e.data)? e.data: "No Error";

            $log.warn('Failed getting images ' + errMessage);
            deferred.reject();
        });
        return deferred.promise;
    };

    FlickrSearch.prototype.getPageSize = function(){
        return flickrParams.pageSize;
    };

    return FlickrSearch;
}]);