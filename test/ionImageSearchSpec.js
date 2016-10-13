describe('ionImageSearch', function() {
    var $compile;
    var $rootScope;
    var $scope;
    var $httpBackend;
    var $timeout;
    var $ionicPosition;
    var $webImageSelector;
    var oldCordova;
    var ionImageSearchDefaultConfigurationMock;
    var $q;
    var imagesMock;
    var searchProviderClassMock;
    var $injector;
    var $ionicModalMock;
    var ionImageSearchProvidersMock;

    beforeEach(module('ionic'));
    beforeEach(module('ion-image-search', function($provide) {
        ionImageSearchProvidersMock = ['providerMock1','providerMock2'];
        ionImageSearchDefaultConfigurationMock = {
            searchProviders: ionImageSearchProvidersMock,
            imgSize: 1,
            fileType: 'mockType',
            maxSuccessiveFails: '1'
        };

        var searchProviderObjectMock = {
            query: function () {
                var deferred = $q.defer();
                deferred.resolve(imagesMock);
                return deferred.promise;
            },

            getPageSize: function () {
                //do nothing
            }
        };

        searchProviderClassMock = function(){
            var getObject = function(){
                return searchProviderObjectMock;
            };
            return {
                query: searchProviderObjectMock.query,
                getPageSize: searchProviderObjectMock.getPageSize,
                getObject: getObject
            };
        };

        $provide.value('providerMock1', searchProviderClassMock);
        $provide.value('providerMock2', searchProviderClassMock);
        $provide.value('ionImageSearchProviders', ionImageSearchProvidersMock);
        $provide.value('ionImageSearchDefaultConfiguration', ionImageSearchDefaultConfigurationMock);
    }));

    //For the new Jasmine 2.0
    beforeEach(function (done) {
        done();
    });

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$injector_, _$q_, _$compile_, _$rootScope_, _$timeout_, _$httpBackend_, $templateCache, _$ionicModal_, _$ionicPosition_, _$webImageSelector_) {
        oldCordova = (typeof cordova !== "undefined")?cordova:null;
        cordova = {
            plugins: {
                Keyboard:{
                    close: function(){
                        //do nothing
                    }
                }
            }
        };

        jasmine.getStyleFixtures().fixturesPath = 'base';
        loadStyleFixtures('test/css/ionic.min.css', 'ionImageSearch.css');

        $httpBackend = _$httpBackend_;
        $httpBackend.when('GET', new RegExp('/\\.*')).respond(200, {
            result: 'Mocked $http'
        });

        // The injector unwraps the underscores (_) from around the parameter names when matching
        $q= _$q_;
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $timeout = _$timeout_;
        $ionicPosition = _$ionicPosition_;
        $ionicModalMock = _$ionicModal_;
        $injector = _$injector_;
        $webImageSelector = _$webImageSelector_;
    }));

    afterEach(function () {
        cordova = oldCordova;
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it("Should show the image search control", function(){
        //arrange
        var modalObjectMock = {
            show: function () {
                //do nothing
            }
        };
        spyOn($ionicModalMock,'fromTemplate').and.callFake(function(){
            return modalObjectMock;
        });

        spyOn(modalObjectMock,'show').and.callThrough();

        //act
        $webImageSelector.show();

        //assert
        expect($ionicModalMock.fromTemplate).toHaveBeenCalled();
        expect(modalObjectMock.show).toHaveBeenCalled();
    });

    it('Should initialize component scope and configuration params', function(){
        $scope = $rootScope.$new();
        var configMock = {
            searchProviders: ['providerMock1']
        };

        //act
        $webImageSelector.init(configMock, $scope);

        //assert
        expect($scope.loadMoreImages).toBeDefined();
        expect($scope.submitSearch).toBeDefined();
        expect($scope.onClearSearch).toBeDefined();
        expect($scope.onCancel).toBeDefined();
        expect($scope.onHideImage).toBeDefined();
        expect($scope.onImageClicked).toBeDefined();
    });

    it("Should get search Provider Options", function (done) {
        //arrange
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];

        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        var searchOptions = $webImageSelector.getSearchProviderOptions();

        //assert
        expect(searchOptions).toEqual(ionImageSearchProvidersMock);
        done();
    });

    it("Should be loaded with a correct search provider default config structure", function(){
        expect(ionImageSearchDefaultConfigurationMock.searchProviders).toBeDefined();
        expect(ionImageSearchDefaultConfigurationMock.imgSize).toBeDefined();
        expect(ionImageSearchDefaultConfigurationMock.fileType).toBeDefined();
        expect(ionImageSearchDefaultConfigurationMock.maxSuccessiveFails).toBeDefined();
    });

    it("Should start search and show results on submission", function (done) {
        //arrange
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];

        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        $scope.submitSearch();
        $timeout.flush();

        setTimeout(function(){
            //assert
            expect(searchProvider.query).toHaveBeenCalledWith($scope.search.text, 1);
            expect($scope.searching).toBe(true);
            expect($scope.displayedImages).toEqual(imagesMock);
            done();
        }, 0);
    });

    it("Should close cordova keyboard upon search submission", function () {
        //arrange
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };
        spyOn(cordova.plugins.Keyboard, 'close');

        //act
        $scope.submitSearch();
        $timeout.flush();

        //assert
        expect(cordova.plugins.Keyboard.close).toHaveBeenCalled();
    });

    it("Should show spinner while searching and results not yet come in", function () {
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        $webImageSelector.show();
        expect(ionicSpinner).not.toBeVisible();
        $scope.submitSearch();
        $scope.$digest();

        var ionicSpinner = $('ion-spinner');

        //assert
        expect($scope.searching).toBe(true);
        expect($scope.displayedImages.length).toBe(0);
        expect(ionicSpinner).toBeVisible();
    });

    it("Should broadcast scroll.infiniteScrollComplete after finishing a query from provider", function (done) {
        //arrange
        var expectedBroadcast = "scroll.infiniteScrollComplete";
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];

        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        spyOn($scope,'$broadcast').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        $scope.submitSearch();
        $timeout.flush();
        $timeout.flush();

        setTimeout(function(){
            //assert
            expect($scope.$broadcast).toHaveBeenCalledWith(expectedBroadcast);
            done();
        }, 0);
    });

    it("Should clear search", function (done) {
        //arrange
        var expectedBroadcast = "scroll.infiniteScrollComplete";
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];

        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        spyOn($scope,'$broadcast').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        $scope.onClearSearch();

        setTimeout(function(){
            //assert
            expect($scope.search.text).toEqual("");
            done();
        }, 0);
    });

    it("Should cancel selection and close modal", function (done) {
        //arrange
        var expectedBroadcast = "scroll.infiniteScrollComplete";
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];

        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        spyOn($scope,'$broadcast').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        $scope.search = {
            text: 'test search text'
        };

        //act
        $webImageSelector.show().then(function(){
            //should not be here
            expect(true).toBe(false);
            setTimeout(function(){
                done();
            },0);
        }, function(){
            expect(true).toBe(true);
            setTimeout(function(){
                done();
            },0);
        });

        $scope.onCancel();
        $scope.$apply();
    });

    it("Should select image onImageClicked and close modal", function (done) {
        //arrange
        var configMock = {
            searchProviders: ['providerMock1', 'providerMock2']
        };
        imagesMock = [{id:1}, {id:2}, {id:2}];
        var mockedImage = {mocked:'image'};
        var searchProvider = (new searchProviderClassMock()).getObject();
        spyOn(searchProvider,'query').and.callThrough();
        spyOn($scope,'$broadcast').and.callThrough();
        $webImageSelector.init(configMock, $scope);
        var searchString = 'test search text';

        //act
        $webImageSelector.show().then(function(res){
            //should not be here
            setTimeout(function(){
                expect(res).toEqual({image: mockedImage, searchString: searchString});
                done();
            },0);
        }, function(){
            expect(true).toBe(false);
            setTimeout(function(){
                done();
            },0);
        });
        $scope.search = {
            text: searchString
        };
        $scope.submitSearch();

        $scope.onImageClicked(mockedImage);
        $scope.$apply();
    });
});