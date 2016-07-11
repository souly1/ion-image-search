angular.module('ion-image-search', ['ionic'])
    .directive('hideOnFail', function () {
        return {
            link: function postLink(scope, iElement) {
                iElement.bind('error', function () {
                    //hide image li
                    angular.element(this).parent().css('display','none');
                });
            }
        };
    })
    .service("$webImageSelector", ['$rootScope', '$ionicModal', '$injector', '$q', '$log', '$timeout', 'ionImageSearchProviders', 'ionImageSearchDefaultConfiguration',
                            function($rootScope, $ionicModal, $injector, $q, $log, $timeout, ionImageSearchProviders, ionImageSearchDefaultConfiguration) {
        "use strict";

        var searchProviders = ionImageSearchProviders;
        var configuration = ionImageSearchDefaultConfiguration;

        var currentSearchProvider=null;
        var modalObject = null;
        var $scope = null;
        var imageLoadIndexStart = 1;
        var successiveFails = 0;
        var showDeferred = null;
        var currentSearch = null;

        var template = ''+
            '<form name="web-search">'+
                '<ion-modal-view>'+
                    '<div class="bar bar-header item-input-inset">'+
                        '<input type="submit" ng-click="submitSearch(search.text)" style="position: absolute; left: -9999px; width: 1px; height: 1px;"/>'+
                        '<button class="button button-icon" ng-click="onCancel()">' +
                            '<i class="ion-android-arrow-back"></i>'+
                        '</button>'+
                        '<label class="item-input-wrapper">'+
                            '<i class="icon ion-ios-search placeholder-icon"></i>'+
                            '<input type="search" placeholder="Search..." ng-model="search.text">'+
                        '</label>'+
                        '<button class="button button-stable button-clear" ng-click="onClearSearch()">'+
                            '<i class="ion-close-round"></i>'+
                        '</button>'+
                    '</div>'+
                    '<ion-content class="has-header" ng-class="{\'ion-web-image-content\': displayedImages.length==0}">'+
                        '<div ng-show="!searching&&(displayedImages.length==0)" class="ion-web-image-no-images">' +
                            'No results'+
                        '</div>'+
                        '<div ng-show="searching&&(displayedImages.length==0)" class="ion-web-image-no-images">' +
                            '<ion-spinner class="ios"></ion-spinner>'+
                        '</div>'+
                        '<div ng-hide="displayedImages.length==0">' +
                            '<ul>'+
                                '<li class="ion-web-image-li" ng-hide="image.hide" ng-repeat="image in displayedImages track by $index" ng-click="onImageClicked(image)">'+
                                    '<img class="ion-web-image-image" hide-on-fail ng-src="{{image.url}}">'+
                                '</li>'+
                            '</ul>'+
                            '<ion-infinite-scroll ng-if="!stopAutoLoad" on-infinite="loadMoreImages()" distance="1%" immediate-check="true">'+
                            '</ion-infinite-scroll>'+
                        '</div>'+
                    '</ion-content>'+
                '</ion-modal-view>'+
            '</form>';

        var reset = function(){
            imageLoadIndexStart = 1;
            successiveFails = 0;
            currentSearch = null;
            currentSearchProvider=null;
            $scope.search = {};
            $scope.search.text = '';
            $scope.displayedImages = [];
            $scope.searching = false;
        };

        var init = function(){
            $scope = $rootScope.$new();

            var addImages = function(images){
                if (images && images.length>0){
                    images.forEach(function(image){
                        $scope.displayedImages.push(image)
                    });
                }
            };

            var isLegalSearchProvider = function(searchProvider){
                return (typeof searchProvider.query === 'function') &&
                    (typeof searchProvider.getPageSize === 'function');
            };

            var onFailedGettingImages = function(){
                if (successiveFails >= configuration.maxSuccessiveFails) {
                    var newProviderIndex = currentSearchProvider.index+1;
                    if (newProviderIndex < configuration.searchProviders.length) {
                        $log.warn('Switching search providers to: ' + configuration.searchProviders[newProviderIndex]);
                        var searchProvider = new ($injector.get(configuration.searchProviders[newProviderIndex]))(configuration);
                        if (isLegalSearchProvider(searchProvider)) {
                            currentSearchProvider = {
                                provider: searchProvider,
                                index: newProviderIndex,
                                name: configuration.searchProviders[newProviderIndex]
                            };
                            successiveFails = 0;
                        } else{
                            throw new Error('Illegal Search Provider: ' + configuration.searchProviders[newProviderIndex] + '. Please see ReadMe for expected provider');
                        }
                    } else {
                        $scope.stopAutoLoad = true;//empty item will show button to retry
                    }
                }
            };

            $scope.loadMoreImages = function(){
                try {
                    if (currentSearch && currentSearch.length>0) {
                        var provider = currentSearchProvider.provider;
                        $log.info('loadedImages from: ' + imageLoadIndexStart + ' to: ' + (imageLoadIndexStart + provider.getPageSize()));
                        provider.query(currentSearch, imageLoadIndexStart)
                            .then(function (images) {
                                imageLoadIndexStart += currentSearchProvider.provider.getPageSize();
                                addImages(images);
                                $log.debug('loaded images successfully');
                                $timeout(function(){
                                    $scope.$broadcast('scroll.infiniteScrollComplete');
                                },100);
                            }, function(){
                                $log.debug('failed loading images');

                                successiveFails++;
                                onFailedGettingImages();

                                if (!$scope.stopAutoLoad && $scope.displayedImages.length==0){
                                    $scope.loadMoreImages();
                                } else {
                                    $scope.$broadcast('scroll.infiniteScrollComplete');
                                    $scope.searching = false;//Required if all searches failed
                                }
                            });
                    } else {
                        $log.debug('Empty search submitted');
                    }
                } catch (e){
                    $log.error(e.toString());
                }
            };

            $scope.submitSearch = function() {
                try {
                    cordova.plugins.Keyboard.close();
                } catch (err){
                    $log.warn('failed to close keyboard');
                }
                $scope.displayedImages = [];
                successiveFails = 0;
                imageLoadIndexStart = 1;
                $scope.stopAutoLoad = false;
                currentSearch = $scope.search.text;
                $scope.searching = true;
                $scope.loadMoreImages();
            };

            $scope.onClearSearch = function(){
                currentSearch = null;
                $scope.search.text = "";
            };

            $scope.onCancel = function(){
                modalObject.remove();
                modalObject = null;
                showDeferred.reject();
            };

            $scope.onHideImage = function(image){
                image.hide=true;
            };

            $scope.onImageClicked = function(image){
                modalObject.remove();
                modalObject = null;
                showDeferred.resolve({image:image, searchString:currentSearch});
            };

            reset();
        };

        var show = function(configParam){
            showDeferred = $q.defer();
            reset();
            if (configParam){
                for (var property in configParam) {
                    if (configParam.hasOwnProperty(property)) {
                        configuration[property] = configParam[property];
                    }
                }
            }

            if (configuration.searchProviders.length>0){
                var searchProvider = new ($injector.get(configuration.searchProviders[0]))(configuration);
                currentSearchProvider = {provider: searchProvider, index:0, name: configuration.searchProviders[0]};
                if (!modalObject){
                    modalObject = $ionicModal.fromTemplate(template, {
                        scope: $scope,
                        animation: 'slide-in-up'
                    });
                }
                $scope.stopAutoLoad = false;
                modalObject.show();
            } else{
                $log.error('Please supply service providers to use');
                showDeferred.reject('Please supply service providers to use');
            }
            return showDeferred.promise
        };

        init();

        return {
            show: show,
            searchProviders: searchProviders
        };
    }]);