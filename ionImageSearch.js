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
                            function($rootScope, $ionicModal, $injector, $q, $log, $timeout, ionImageSearchProviders, _ionImageSearchDefaultConfiguration_) {
        "use strict";

        var searchProviderOptions = ionImageSearchProviders;
        var getSearchProviderOptions = function(){
            return searchProviderOptions;
        };
        var ionImageSearchDefaultConfiguration = _ionImageSearchDefaultConfiguration_;
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
                        '<input type="submit" ng-click="submitSearch()" style="position: absolute; left: -9999px; width: 1px; height: 1px;"/>'+
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
                            '<ion-infinite-scroll ng-if="!hideInfiniteScroll" on-infinite="loadMoreImages()" distance="1%" immediate-check="true">'+
                            '</ion-infinite-scroll>'+
                        '</div>'+
                    '</ion-content>'+
                '</ion-modal-view>'+
            '</form>';

        var reset = function(){
            imageLoadIndexStart = 1;
            successiveFails = 0;
            currentSearch = null;
            $scope.search = {};
            $scope.search.text = '';
            $scope.displayedImages = [];
            $scope.searching = false;
        };

        /**
         * if set providers fails for any reason it will use defaults
         * @param configParam
         */
        var setProviders = function(configParam){
            try {
                configuration = {};
                currentSearchProvider = null;
                if (configParam) {
                    for (var property in configParam) {
                        if (configParam.hasOwnProperty(property)) {
                            configuration[property] = configParam[property];
                        }
                    }
                    for (var defaultConfigProperty in ionImageSearchDefaultConfiguration) {
                        if (ionImageSearchDefaultConfiguration.hasOwnProperty(defaultConfigProperty)) {
                            if (configuration[defaultConfigProperty] === undefined){
                                configuration[defaultConfigProperty] = ionImageSearchDefaultConfiguration[defaultConfigProperty];
                            }
                        }
                    }
                } else{
                    useDefaultConfiguration();
                }

                if (configuration && configuration.searchProviders.length > 0) {
                    setCurrentSearchProvider(configuration.searchProviders, configuration);
                } else{
                    useDefaultConfiguration();
                }
            } catch (e){
                $log.error('Failed to set providers, using defaults');
                useDefaultConfiguration();
            }
        };

        var useDefaultConfiguration = function(){
            configuration = ionImageSearchDefaultConfiguration;
            setCurrentSearchProvider(configuration.searchProviders, configuration);
        };

        var setCurrentSearchProvider = function(searchProviders, constructorParams){
            var hasSucceeded = false;
            var searchProvider = new ($injector.get(searchProviders[0]))(constructorParams);
            if (searchProvider) {
                currentSearchProvider = {
                    provider: searchProvider,
                    index: 0,
                    name: configuration.searchProviders[0]
                };
                hasSucceeded = true;
            } else{
                $log.error('Failed to inject specified search provider');
                hasSucceeded = false;
            }
            return hasSucceeded;
        };

        var initializeComponent = function(){
            try {
                var addImages = function (images) {
                    if (images && images.length > 0) {
                        images.forEach(function (image) {
                            $scope.displayedImages.push(image)
                        });
                    }
                };

                var isLegalSearchProvider = function (searchProvider) {
                    return (typeof searchProvider.query === 'function') &&
                        (typeof searchProvider.getPageSize === 'function');
                };

                var onFailedGettingImages = function () {
                    if (successiveFails >= configuration.maxSuccessiveFails) {
                        var newProviderIndex = currentSearchProvider.index + 1;
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
                            } else {
                                throw new Error('Illegal Search Provider: ' + configuration.searchProviders[newProviderIndex] + '. Please see ReadMe for expected provider');
                            }
                        } else {
                            $scope.hideInfiniteScroll = true;//empty item will show button to retry
                        }
                    }
                };

                $scope.loadMoreImages = function () {
                    try {
                        if (currentSearch && currentSearch.length > 0) {
                            var provider = currentSearchProvider.provider;
                            $log.info('loadedImages from: ' + imageLoadIndexStart + ' to: ' + (imageLoadIndexStart + provider.getPageSize()));
                            provider.query(currentSearch, imageLoadIndexStart)
                                .then(function (images) {
                                    imageLoadIndexStart += currentSearchProvider.provider.getPageSize();
                                    addImages(images);
                                    $log.debug('loaded images successfully');
                                    $timeout(function () {
                                        $scope.$broadcast('scroll.infiniteScrollComplete');
                                    }, 100);
                                }, function () {
                                    $log.debug('failed loading images');

                                    successiveFails++;
                                    onFailedGettingImages();

                                    if (!$scope.hideInfiniteScroll && $scope.displayedImages.length == 0) {
                                        $scope.loadMoreImages();
                                    } else {
                                        $scope.$broadcast('scroll.infiniteScrollComplete');
                                        $scope.searching = false;//Required if all searches failed
                                    }
                                });
                        } else {
                            $log.debug('Empty search submitted');
                        }
                    } catch (e) {
                        $log.error(e.toString());
                    }
                };

                $scope.submitSearch = function () {
                    try {
                        cordova.plugins.Keyboard.close();
                    } catch (err) {
                        $log.warn('failed to close keyboard');
                    }
                    $scope.displayedImages = [];
                    successiveFails = 0;
                    imageLoadIndexStart = 1;
                    $scope.hideInfiniteScroll = false;
                    currentSearch = $scope.search.text;
                    $scope.searching = true;
                    $scope.loadMoreImages();
                };

                $scope.onClearSearch = function () {
                    currentSearch = null;
                    $scope.search.text = "";
                };

                $scope.onCancel = function () {
                    modalObject.remove();
                    modalObject = null;
                    showDeferred.reject();
                };

                $scope.onHideImage = function (image) {
                    image.hide = true;
                };

                $scope.onImageClicked = function (image) {
                    modalObject.remove();
                    modalObject = null;
                    showDeferred.resolve({image: image, searchString: currentSearch});
                };
            } catch (e){
                $log.fatal('Failed to set scope, ionImageSearch will not work!');
            }
        };

        var init = function(configuration, scope){
            if (!scope) {
                scope = $rootScope.$new();
            }
            $scope = scope;
            initializeComponent();

            setProviders(configuration);
            reset();
        };

        var show = function(){
            //if we did not call manual delete set new scope and use default configurations
            showDeferred = $q.defer();
            if (!$scope){
                $log.warn('ionImageSearch not initialized, using defaults');
                init(null, $rootScope.$new());
            }
            reset();

            var hasSearchProviders = (Object.getOwnPropertyNames(searchProviderOptions)).length > 0;
            if (hasSearchProviders){
                if (!modalObject){
                    modalObject = $ionicModal.fromTemplate(template, {
                        scope: $scope,
                        animation: 'slide-in-up'
                    });
                }
                $scope.hideInfiniteScroll = false;
                modalObject.show();
            } else{
                $log.error('Please make sure your configuration has service providers to use');
                showDeferred.reject('Please make sure your configuration has service providers to use');
            }

            return showDeferred.promise;
        };

        return {
            init: init,
            show: show,
            getSearchProviderOptions: getSearchProviderOptions
        };
    }]);