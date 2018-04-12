const electronService = electron.remote.app;

function logChanged(watched, newVal, oldVal) {
    console.log(watched + " has been changed: " + oldVal + " => " + newVal);
}

var app = angular.module("RedisOperator", ["ngRoute", "jsonFormatter"]);

app.config(function ($routeProvider, JSONFormatterConfigProvider) {
    JSONFormatterConfigProvider.hoverPreviewEnabled = true;
    $routeProvider
        .when("/home", {
            templateUrl: "templates/home.html",
            controller: "homeController"
        })
        .when("/showall", {
            templateUrl: "templates/showall.html",
            controller: "showAllController",
            resolve: {
                title: function () {
                    return "Redis Operator";
                }
            }
        })
        .otherwise({redirectTo: "/showall"});
    electronService.stopWebdis();
    electronService.startWebdis().then(console.log("Webdis started")).catch(console.log);
});

app.controller("showAllController", ['$scope', '$http', function ($scope, $http) {
    $scope.title = electronService.title;
    $scope.stage = config.local.stage;
    $scope.host = config[$scope.stage].redis.host;
    $scope.hosts = config[$scope.stage].redis.hosts;
    $scope.loading = false;

    $scope.$watch("stage", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            logChanged("stage", newValue, oldValue);
            $scope.hosts = config[$scope.stage].redis.hosts;
            $scope.host = config[$scope.stage].redis.host;
            electronService.changed($scope.stage, $scope.host);
            $scope.fetchEntries();
        }
    });

    $scope.$watch("host", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            logChanged("host", newValue, oldValue);
            electronService.changed($scope.stage, $scope.host);
            $scope.fetchEntries();
        }
    });

    $scope.$watch("filter", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            $scope.fetchEntries();
        }
    });

    $scope.$watch("key", function (newValue, oldValue) {
        if (oldValue !== newValue) {
            $scope.fetchEntries();
        }
    });

    $scope.fetchEntries = function () {
        if ($scope.filter) {
            $scope.loading = true;
            delete $scope.entry;
            delete $scope.key;
            var filter = $scope.filter.indexOf('*') > -1 ? $scope.filter : $scope.filter + "*";
            filter = $scope.namespace && config[$scope.stage].namespace + filter || filter;
            const requestUrl = "http://127.0.0.1:7379/keys/" + encodeURIComponent(filter);
            $http({
                      method: "GET",
                      url: requestUrl
                  }).then(function successCallback(response) {
                console.log("GET " + requestUrl);
                $scope.keys = response.data;
                $scope.loading = false;
            }, function errorCallback(err) {
                console.log(JSON.stringify(err));
                $scope.loading = false;
            });
        } else if ($scope.key) {
            $scope.loading = true;
            delete $scope.keys;
            delete $scope.filter;
            const key = $scope.namespace && config[$scope.stage].namespace + $scope.key || $scope.key;
            const requestUrl = "http://127.0.0.1:7379/get/" + encodeURIComponent(key);
            $http({
                      method: "GET",
                      url: requestUrl
                  }).then(function successCallback(response) {
                console.log("GET " + requestUrl);
                $scope.entry = JSON.parse(response.data.get);
                $scope.loading = false;
            }, function errorCallback(err) {
                console.log(JSON.stringify(err));
                $scope.loading = false;
            });
        }
    };

    $scope.fetchEntries();
}]);


app.controller("homeController", function ($scope) {
    $scope.title = "Home";
});