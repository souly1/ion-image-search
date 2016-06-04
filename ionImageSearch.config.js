angular.module('ion-image-search').
    config(function($provide) {
        "use strict";

        var searchProviders = {
            Google: 'googleSearch',
            Bing: 'bingSearch',
            Flickr: 'flickrSearch'
        };

        var imgSizes = {
            small: 'small'
        };

        var fileTypes = {
            png: 'png',
            gif: 'gif',
            jpg: 'jpg'
        };

        var defaultConfiguration = {
            searchProviders: [searchProviders.Google, searchProviders.Bing, searchProviders.Flickr],
            imgSize: imgSizes.small,
            fileType: fileTypes.jpg,
            maxSuccessiveFails: 5
        };

        var googleParams = {
            address: 'https://www.googleapis.com/customsearch/v1?',
            key: '',
            customSearch: '',
            pageSize: 10
        };

        var bingParams = {
            address: 'https://api.datamarket.azure.com/Bing/Search/v1/Image?',
            key: '',
            auth: 'Basic ',
            pageSize: 50
        };

        var flickrParams = {
            address: 'https://api.flickr.com/services/rest/?method=flickr.photos.search&',
            key: '',
            pageSize: 100
        };

        $provide.value('ionImageSearchProviders', searchProviders);
        $provide.value('ionImageSearchDefaultConfiguration', defaultConfiguration);
        $provide.value('googleParams', googleParams);
        $provide.value('bingParams', bingParams);
        $provide.value('flickrParams', flickrParams);

    });